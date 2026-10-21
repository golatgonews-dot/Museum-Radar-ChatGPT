const DATA_PATH = "../data/exhibitions.json";

const listEl = document.querySelector("#exhibition-list");
const statusEl = document.querySelector("#status");
const categoryFilter = document.querySelector("#category-filter");
const distanceFilter = document.querySelector("#distance-filter");
const statusFilter = document.querySelector("#status-filter");
const clearFiltersButton = document.querySelector("#clear-filters");

const viewTabs = document.querySelectorAll(".view-tab");
const upcomingView = document.querySelector("#upcoming-view");
const calendarView = document.querySelector("#calendar-view");
const mapView = document.querySelector("#map-view");

const calendarTitle = document.querySelector("#calendar-title");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarPrev = document.querySelector("#calendar-prev");
const calendarNext = document.querySelector("#calendar-next");
const calendarToday = document.querySelector("#calendar-today");
const upcomingDatesList = document.querySelector("#upcoming-dates-list");
const upcomingDatesCount = document.querySelector("#upcoming-dates-count");

const mapStatus = document.querySelector("#map-status");

const DAY = 24 * 60 * 60 * 1000;
const STATUS_STORAGE_KEY = "museumRadar.personalStatus.v1";
const REVIEWED_STORAGE_KEY = "museumRadar.reviewedExhibitions.v1";
const LEGACY_SEEN_STORAGE_KEY = "museumRadar.seenExhibitions.v1";

let allExhibitions = [];
let museumMap = null;
let markerLayer = null;

let calendarCursor = new Date();
calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);

const museumLocations = {
  "Philadelphia Museum of Art": {
    lat: 39.9656,
    lng: -75.1809,
    city: "Philadelphia",
    state: "PA"
  },
  "Penn Museum": {
    lat: 39.9494,
    lng: -75.1917,
    city: "Philadelphia",
    state: "PA"
  },
  "The Metropolitan Museum of Art": {
    lat: 40.7794,
    lng: -73.9632,
    city: "New York",
    state: "NY"
  },
  "Institute for the Study of the Ancient World (NYU)": {
    lat: 40.7800,
    lng: -73.9607,
    city: "New York",
    state: "NY"
  }
};


function loadSavedStatuses() {
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("Could not read saved Museum Radar statuses.", error);
    return {};
  }
}

function saveStatus(exhibitionId, status) {
  try {
    const saved = loadSavedStatuses();

    if (!status || status === "None") {
      delete saved[exhibitionId];
    } else {
      saved[exhibitionId] = status;
    }

    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    console.warn("Could not save Museum Radar status.", error);
  }
}

function applySavedStatuses(exhibitions) {
  const saved = loadSavedStatuses();

  return exhibitions.map((exhibition) => ({
    ...exhibition,
    user_status: saved[exhibition.exhibition_id] || exhibition.user_status || "None"
  }));
}

function updateExhibitionStatus(exhibitionId, status) {
  const exhibition = allExhibitions.find(
    (item) => item.exhibition_id === exhibitionId
  );

  if (!exhibition) return;

  exhibition.user_status = status;
  saveStatus(exhibitionId, status);

  renderUpcoming();

  if (!mapView.hidden) {
    renderMap();
  }

  if (!calendarView.hidden) {
    renderCalendar();
  }
}


function loadReviewedExhibitions() {
  try {
    const reviewedRaw = localStorage.getItem(REVIEWED_STORAGE_KEY);

    if (reviewedRaw) {
      return JSON.parse(reviewedRaw);
    }

    // Backward compatibility with the earlier "seen" QA implementation.
    const legacyRaw = localStorage.getItem(LEGACY_SEEN_STORAGE_KEY);
    return legacyRaw ? JSON.parse(legacyRaw) : {};
  } catch (error) {
    console.warn("Could not read Museum Radar review state.", error);
    return {};
  }
}

function saveReviewedState(exhibitionId, reviewed = true) {
  try {
    const saved = loadReviewedExhibitions();

    if (reviewed) {
      saved[exhibitionId] = true;
    } else {
      delete saved[exhibitionId];
    }

    localStorage.setItem(REVIEWED_STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    console.warn("Could not save Museum Radar review state.", error);
  }
}

function isUnreviewed(exhibition) {
  if (exhibition.is_new !== true) return false;

  const reviewed = loadReviewedExhibitions();
  return reviewed[exhibition.exhibition_id] !== true;
}

function markExhibitionReviewed(exhibitionId) {
  saveReviewedState(exhibitionId, true);
  renderUpcoming();

  if (!calendarView.hidden) {
    renderCalendar();
  }

  if (!mapView.hidden) {
    renderMap();
  }
}

function parseDate(value) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysFromToday(value) {
  const date = parseDate(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Math.ceil((date - today) / DAY);
}

function isClosingSoon(exhibition) {
  const closesIn = daysFromToday(exhibition.closing_date);
  return closesIn !== null && closesIn >= 0 && closesIn <= 30;
}

function formatDate(value) {
  if (!value) return "Date not listed";

  const date = parseDate(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function shortMuseum(name) {
  const abbreviations = {
    "Philadelphia Museum of Art": "PMA",
    "Penn Museum": "Penn",
    "The Metropolitan Museum of Art": "Met",
    "Institute for the Study of the Ancient World (NYU)": "ISAW"
  };

  return abbreviations[name] || name;
}

function shortCity(city) {
  const abbreviations = {
    "Philadelphia": "PHL",
    "New York": "NYC",
    "Washington": "DC",
    "Boston": "BOS"
  };

  return abbreviations[city] || city;
}

function textOrFallback(value, fallback = "Not listed") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function getGroup(exhibition) {
  const opensIn = daysFromToday(exhibition.opening_date);
  const closesIn = daysFromToday(exhibition.closing_date);

  if (isClosingSoon(exhibition)) return "Closing Soon";

  if (opensIn !== null && opensIn > 0 && opensIn <= 30) {
    return "Opening Soon";
  }

  const opensWithin90 = opensIn !== null && opensIn > 30 && opensIn <= 90;
  const closesWithin90 = closesIn !== null && closesIn > 30 && closesIn <= 90;

  if (opensWithin90 || closesWithin90) {
    return "Next 3 Months";
  }

  return "Later";
}

function getSortDate(exhibition, group) {
  if (group === "Closing Soon") {
    return parseDate(exhibition.closing_date) || new Date("9999-12-31");
  }

  if (group === "Opening Soon") {
    return parseDate(exhibition.opening_date) || new Date("9999-12-31");
  }

  const opening = parseDate(exhibition.opening_date);
  const closing = parseDate(exhibition.closing_date);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (opening && opening > today) return opening;
  if (closing && closing >= today) return closing;

  return new Date("9999-12-31");
}


function hasAttentionChange(exhibition) {
  const value = exhibition.change_type;

  return Boolean(
    value &&
    value !== "None" &&
    value !== "No change" &&
    value !== "New exhibition"
  );
}

function normalizedChangeLabel(exhibition) {
  if (!hasAttentionChange(exhibition)) return null;

  const supportedLabels = {
    "Tickets released": "Tickets released",
    "Dates changed": "Dates changed",
    "Major information added": "Major information added",
    "Priority Watch match": "Priority Watch match",
    "Closing soon": "Closing soon"
  };

  return supportedLabels[exhibition.change_type] || exhibition.change_type;
}

function matchesStatus(exhibition, filterValue) {
  if (filterValue === "all") return true;
  if (filterValue === "unreviewed") return isUnreviewed(exhibition);
  if (filterValue === "tickets") return exhibition.ticket_status === "Available";
  if (filterValue === "interested") return exhibition.user_status === "Interested";
  if (filterValue === "planning") return exhibition.user_status === "Planning";
  if (filterValue === "attended") return exhibition.user_status === "Attended";
  if (filterValue === "attention") return hasAttentionChange(exhibition);
  if (filterValue === "closing") return isClosingSoon(exhibition);

  return true;
}

function filterExhibitions(exhibitions) {
  return exhibitions.filter((exhibition) => {
    const categoryMatch =
      categoryFilter.value === "all" ||
      exhibition.primary_category === categoryFilter.value;

    const distanceMatch =
      distanceFilter.value === "all" ||
      exhibition.trip_type === distanceFilter.value;

    const statusMatch = matchesStatus(exhibition, statusFilter.value);

    return categoryMatch && distanceMatch && statusMatch;
  });
}

function detailBlock(label, value, full = false) {
  return `
    <div class="detail-block${full ? " full" : ""}">
      <p class="detail-label">${label}</p>
      <p class="detail-value">${textOrFallback(value)}</p>
    </div>
  `;
}

function renderCard(exhibition) {
  const article = document.createElement("article");
  article.className = "exhibition-card";

  const detailId = `details-${exhibition.exhibition_id}`;

  const badges = [
    exhibition.primary_category,
    isUnreviewed(exhibition) ? "Unreviewed" : null,
    exhibition.ticket_status === "Available" ? "Tickets available" : null,
    isClosingSoon(exhibition) ? "Closing soon" : null,
    exhibition.user_status && exhibition.user_status !== "None"
      ? exhibition.user_status
      : null,
    normalizedChangeLabel(exhibition)
  ].filter(Boolean);

  const tags = Array.isArray(exhibition.secondary_tags)
    ? exhibition.secondary_tags.join(" · ")
    : textOrFallback(exhibition.secondary_tags);

  article.innerHTML = `
    <div class="card-topline">
      ${badges.map((badge) => `<span class="badge${badge === normalizedChangeLabel(exhibition) ? " attention" : ""}">${badge}</span>`).join("")}
    </div>

    <h3>${exhibition.exhibition_title}</h3>
    <p class="location">${shortMuseum(exhibition.institution_name)} · ${shortCity(exhibition.city)}</p>
    <p class="dates">${formatDate(exhibition.opening_date)} → ${formatDate(exhibition.closing_date)}</p>
    <p class="ticket-status"><strong>Ticket status:</strong> ${exhibition.ticket_status || "Unknown"}</p>
    <p class="summary">${exhibition.why_relevant || exhibition.short_description || ""}</p>

    <button
      class="card-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="${detailId}"
    >
      View details
    </button>

    <div class="card-details" id="${detailId}">
      <div class="detail-grid">
        ${detailBlock("Museum", `${exhibition.institution_name} — ${exhibition.city}, ${exhibition.state_region}`)}
        <div class="detail-block">
          <p class="detail-label">Personal status</p>
          <label class="personal-status-control">
            <select
              class="personal-status-select"
              data-exhibition-id="${exhibition.exhibition_id}"
              aria-label="Personal status for ${exhibition.exhibition_title}"
            >
              <option value="None"${exhibition.user_status === "None" ? " selected" : ""}>None</option>
              <option value="Interested"${exhibition.user_status === "Interested" ? " selected" : ""}>Interested</option>
              <option value="Planning"${exhibition.user_status === "Planning" ? " selected" : ""}>Planning</option>
              <option value="Attended"${exhibition.user_status === "Attended" ? " selected" : ""}>Attended</option>
            </select>
          </label>
        </div>
        ${detailBlock("Opening", formatDate(exhibition.opening_date))}
        ${detailBlock("Closing", formatDate(exhibition.closing_date))}
        ${detailBlock("Ticket status", exhibition.ticket_status)}
        ${detailBlock("Ticket price", exhibition.ticket_price)}
        ${detailBlock("Reservation required", exhibition.reservation_required)}
        ${detailBlock("Trip type", exhibition.trip_type)}
        ${detailBlock("Distance from Philadelphia", exhibition.distance_miles !== null ? `${exhibition.distance_miles} miles` : null)}
        ${detailBlock("Presale / member info", exhibition.presale_member_info)}
        ${detailBlock("Description", exhibition.short_description, true)}
        ${detailBlock("Why it matches", exhibition.why_relevant, true)}
        ${detailBlock("Notable content", exhibition.notable_content, true)}
        ${detailBlock("Tags", tags, true)}
        ${detailBlock("Personal notes", exhibition.personal_notes, true)}

        <div class="detail-block full">
          <p class="detail-label">Latest change</p>
          <div class="change-detail">
            ${
              hasAttentionChange(exhibition)
                ? `<strong>${normalizedChangeLabel(exhibition)}</strong>`
                : `<span class="review-note">No active change signal</span>`
            }
          </div>
        </div>

        <div class="detail-block full">
          <p class="detail-label">Review status</p>
          <div class="review-acknowledgement">
            ${
              isUnreviewed(exhibition)
                ? `<button
                    type="button"
                    class="mark-reviewed-button"
                    data-exhibition-id="${exhibition.exhibition_id}"
                  >
                    Mark as reviewed
                  </button>`
                : `<span class="review-note">Reviewed</span>`
            }
          </div>
        </div>

        <div class="detail-block full">
          <p class="detail-label">Links</p>
          <div class="detail-links">
            <a href="${exhibition.exhibition_url}" target="_blank" rel="noopener noreferrer">Exhibition page</a>
            ${
              exhibition.source_url && exhibition.source_url !== exhibition.exhibition_url
                ? `<a href="${exhibition.source_url}" target="_blank" rel="noopener noreferrer">Source</a>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  const toggle = article.querySelector(".card-toggle");
  const statusSelect = article.querySelector(".personal-status-select");
  const markReviewedButton = article.querySelector(".mark-reviewed-button");

  if (markReviewedButton) {
    markReviewedButton.addEventListener("click", () => {
      markExhibitionReviewed(exhibition.exhibition_id);
    });
  }

  statusSelect.addEventListener("change", (event) => {
    updateExhibitionStatus(
      exhibition.exhibition_id,
      event.target.value
    );
  });

  toggle.addEventListener("click", () => {
    const expanded = article.classList.toggle("expanded");
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.textContent = expanded ? "Hide details" : "View details";
  });

  return article;
}

function renderGroup(title, exhibitions) {
  if (!exhibitions.length) return null;

  const section = document.createElement("section");
  section.className = "exhibition-group";

  const heading = document.createElement("div");
  heading.className = "group-heading";

  heading.innerHTML = `
    <h2>${title}</h2>
    <span class="count">${exhibitions.length}</span>
  `;

  const cards = document.createElement("div");
  cards.className = "group-cards";
  cards.replaceChildren(...exhibitions.map(renderCard));

  section.append(heading, cards);

  return section;
}

function renderUpcoming() {
  const exhibitions = filterExhibitions(allExhibitions);

  const groupOrder = [
    "Closing Soon",
    "Opening Soon",
    "Next 3 Months",
    "Later"
  ];

  const grouped = Object.fromEntries(
    groupOrder.map((group) => [group, []])
  );

  exhibitions.forEach((exhibition) => {
    grouped[getGroup(exhibition)].push(exhibition);
  });

  groupOrder.forEach((group) => {
    grouped[group].sort(
      (a, b) => getSortDate(a, group) - getSortDate(b, group)
    );
  });

  const sections = groupOrder
    .map((group) => renderGroup(group, grouped[group]))
    .filter(Boolean);

  statusEl.textContent = `${exhibitions.length} of ${allExhibitions.length} active exhibitions shown`;

  if (!sections.length) {
    listEl.innerHTML = '<div class="empty">No exhibitions match the selected filters.</div>';
    return;
  }

  listEl.replaceChildren(...sections);
}

function buildCalendarEvents() {
  const events = new Map();

  function pushEvent(dateValue, exhibition, type) {
    if (!dateValue) return;

    if (!events.has(dateValue)) {
      events.set(dateValue, []);
    }

    events.get(dateValue).push({
      exhibition,
      type
    });
  }

  allExhibitions.forEach((exhibition) => {
    pushEvent(exhibition.opening_date, exhibition, "Opens");
    pushEvent(exhibition.closing_date, exhibition, "Closes");
  });

  return events;
}


function buildUpcomingMilestones(limit = 12) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const milestones = [];

  allExhibitions.forEach((exhibition) => {
    const opening = parseDate(exhibition.opening_date);
    const closing = parseDate(exhibition.closing_date);

    if (opening && opening >= today) {
      milestones.push({
        date: opening,
        dateValue: exhibition.opening_date,
        type: "Opens",
        exhibition
      });
    }

    if (closing && closing >= today) {
      milestones.push({
        date: closing,
        dateValue: exhibition.closing_date,
        type: "Closes",
        exhibition
      });
    }
  });

  return milestones
    .sort((a, b) => {
      const diff = a.date - b.date;
      if (diff !== 0) return diff;

      // On the same date, openings appear before closings.
      if (a.type === b.type) {
        return a.exhibition.exhibition_title.localeCompare(
          b.exhibition.exhibition_title
        );
      }

      return a.type === "Opens" ? -1 : 1;
    })
    .slice(0, limit);
}

function renderUpcomingDates() {
  const milestones = buildUpcomingMilestones(12);

  upcomingDatesCount.textContent = milestones.length
    ? `Next ${milestones.length} milestones`
    : "";

  if (!milestones.length) {
    upcomingDatesList.innerHTML = `
      <div class="upcoming-dates-empty">
        No upcoming opening or closing milestones are currently listed.
      </div>
    `;
    return;
  }

  let currentYear = null;
  const rows = [];

  milestones.forEach(({ dateValue, type, exhibition }) => {
    const date = parseDate(dateValue);
    const year = date.getFullYear();
    const typeClass = type === "Opens" ? "opens" : "closes";

    if (year !== currentYear) {
      rows.push(`
        <div class="upcoming-date-year">${year}</div>
      `);
      currentYear = year;
    }

    rows.push(`
      <div class="upcoming-date-row">
        <span class="upcoming-date-date">${new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric"
        }).format(date)}</span>

        <span class="upcoming-date-type ${typeClass}">${type}</span>

        <a
          class="upcoming-date-title"
          href="${exhibition.exhibition_url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${exhibition.exhibition_title}
        </a>

        <span class="upcoming-date-location">
          ${shortMuseum(exhibition.institution_name)} · ${shortCity(exhibition.city)}
        </span>
      </div>
    `);
  });

  upcomingDatesList.innerHTML = rows.join("");
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();

  calendarTitle.textContent = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(calendarCursor);

  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());

  const events = buildCalendarEvents();
  const todayKey = dateKey(new Date());

  const days = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const key = dateKey(date);
    const inMonth = date.getMonth() === month;
    const dayEvents = events.get(key) || [];

    const cell = document.createElement("div");
    cell.className = "calendar-day";

    if (!inMonth) cell.classList.add("outside-month");
    if (key === todayKey) cell.classList.add("today");

    const eventMarkup = dayEvents.map(({ exhibition, type }) => `
      <a
        class="calendar-event ${type === "Opens" ? "event-opens" : "event-closes"}"
        href="${exhibition.exhibition_url}"
        target="_blank"
        rel="noopener noreferrer"
        title="${exhibition.exhibition_title}"
      >
        <span class="event-type">${type}</span>
        <span class="event-title">${exhibition.exhibition_title}</span>
        <span class="event-location">${shortMuseum(exhibition.institution_name)} · ${shortCity(exhibition.city)}</span>
      </a>
    `).join("");

    cell.innerHTML = `
      <span class="calendar-day-number">${date.getDate()}</span>
      <div class="calendar-events">${eventMarkup}</div>
    `;

    days.push(cell);
  }

  calendarGrid.replaceChildren(...days);
  renderUpcomingDates();
}

function groupByInstitution() {
  const grouped = new Map();

  allExhibitions.forEach((exhibition) => {
    const institution = exhibition.institution_name;
    const location = museumLocations[institution];

    if (!location) return;

    if (!grouped.has(institution)) {
      grouped.set(institution, {
        institution,
        location,
        exhibitions: []
      });
    }

    grouped.get(institution).exhibitions.push(exhibition);
  });

  return [...grouped.values()];
}

function popupHtml(group) {
  const items = group.exhibitions
    .map((exhibition) => `
      <li>
        <a
          href="${exhibition.exhibition_url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${exhibition.exhibition_title}
        </a>
      </li>
    `)
    .join("");

  return `
    <div class="map-popup">
      <h3>${group.institution}</h3>
      <p>${group.location.city}, ${group.location.state}</p>
      <ul>${items}</ul>
    </div>
  `;
}

function renderMap() {
  if (!window.L) {
    mapStatus.textContent = "Map library could not load.";
    return;
  }

  const institutions = groupByInstitution();

  if (!museumMap) {
    museumMap = L.map("museum-map", {
      scrollWheelZoom: false
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }
    ).addTo(museumMap);

    markerLayer = L.layerGroup().addTo(museumMap);
  }

  markerLayer.clearLayers();

  const bounds = [];

  institutions.forEach((group) => {
    const marker = L.marker([
      group.location.lat,
      group.location.lng
    ]);

    marker.bindPopup(popupHtml(group));
    marker.addTo(markerLayer);

    bounds.push([
      group.location.lat,
      group.location.lng
    ]);
  });

  if (bounds.length) {
    museumMap.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 9
    });
  } else {
    museumMap.setView([39.9526, -75.1652], 7);
  }

  const exhibitionCount = institutions.reduce(
    (sum, institution) => sum + institution.exhibitions.length,
    0
  );

  mapStatus.textContent =
    `${institutions.length} institutions · ${exhibitionCount} exhibitions`;

  setTimeout(() => {
    museumMap.invalidateSize();
  }, 50);
}

function switchView(viewName) {
  viewTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === viewName);
  });

  upcomingView.hidden = viewName !== "upcoming";
  calendarView.hidden = viewName !== "calendar";
  mapView.hidden = viewName !== "map";

  if (viewName === "calendar") {
    renderCalendar();
  }

  if (viewName === "map") {
    renderMap();
  }
}

async function loadExhibitions() {
  try {
    const response = await fetch(DATA_PATH);

    if (!response.ok) {
      throw new Error(`Could not load exhibition data (${response.status})`);
    }

    const payload = await response.json();

    allExhibitions = applySavedStatuses(
      (
        Array.isArray(payload)
          ? payload
          : payload.exhibitions || []
      ).filter((item) => item.archive_status !== "Archived")
    );

    renderUpcoming();
    renderCalendar();
  } catch (error) {
    console.error(error);

    statusEl.textContent = "Unable to load exhibition data.";

    listEl.innerHTML = `
      <div class="empty">${error.message}</div>
    `;
  }
}

[categoryFilter, distanceFilter, statusFilter].forEach((control) => {
  control.addEventListener("change", renderUpcoming);
});

clearFiltersButton.addEventListener("click", () => {
  categoryFilter.value = "all";
  distanceFilter.value = "all";
  statusFilter.value = "all";
  renderUpcoming();
});

viewTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchView(tab.dataset.view);
  });
});

calendarPrev.addEventListener("click", () => {
  calendarCursor = new Date(
    calendarCursor.getFullYear(),
    calendarCursor.getMonth() - 1,
    1
  );

  renderCalendar();
});

calendarNext.addEventListener("click", () => {
  calendarCursor = new Date(
    calendarCursor.getFullYear(),
    calendarCursor.getMonth() + 1,
    1
  );

  renderCalendar();
});

calendarToday.addEventListener("click", () => {
  const today = new Date();

  calendarCursor = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  renderCalendar();
});

loadExhibitions();
