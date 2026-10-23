const DATA_PATH = "../data/exhibitions.json";

const listEl = document.querySelector("#exhibition-list");
const statusEl = document.querySelector("#status");
const categoryFilter = document.querySelector("#category-filter");
const distanceFilter = document.querySelector("#distance-filter");
const timingFilter = document.querySelector("#timing-filter");
const archiveList = document.querySelector("#archive-list");
const archiveCount = document.querySelector("#archive-count");
const actionStatus = document.querySelector("#action-status");
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

// Museum coordinates checked against OpenStreetMap, October 22, 2026.
const museumLocations = {
  "Institute for the Study of the Ancient World (NYU)": {
    "lat": 40.7799962,
    "lng": -73.9602106,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/way/266934250"
  },
  "The Metropolitan Museum of Art": {
    "lat": 40.7794396,
    "lng": -73.9633825,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/relation/3698894"
  },
  "Penn Museum": {
    "lat": 39.9492859,
    "lng": -75.1920297,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/relation/5231601"
  },
  "Philadelphia Museum of Art": {
    "lat": 39.9655661,
    "lng": -75.1815202,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/28533972"
  },
  "Barnes Foundation": {
    "lat": 39.9605495,
    "lng": -75.1726581,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/183620616"
  },
  "Museum at FIT": {
    "lat": 40.7466544,
    "lng": -73.9941473,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/node/3623620317"
  },
  "Whitney Museum of American Art": {
    "lat": 40.7396451,
    "lng": -74.008921,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/way/288749896"
  },
  "Museum of the City of New York": {
    "lat": 40.7925266,
    "lng": -73.951802,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/way/271220752"
  },
  "Cooper Hewitt, Smithsonian Design Museum": {
    "lat": 40.7842843,
    "lng": -73.957699,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/way/266926168"
  },
  "National Museum of American History": {
    "lat": 38.8912397,
    "lng": -77.0300205,
    "city": "Washington",
    "state": "DC",
    "coordinate_source": "https://www.openstreetmap.org/way/445808462"
  },
  "Museum of Fine Arts, Boston": {
    "lat": 42.3394573,
    "lng": -71.093897,
    "city": "Boston",
    "state": "MA",
    "coordinate_source": "https://www.openstreetmap.org/relation/63938"
  },
  "Science History Institute": {
    "lat": 39.9491077,
    "lng": -75.1465328,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/335308190"
  },
  "Peabody Essex Museum": {
    "lat": 42.5215925,
    "lng": -70.8921931,
    "city": "Salem",
    "state": "MA",
    "coordinate_source": "https://www.openstreetmap.org/way/215901152"
  },
  "Musée d’Art Moderne de Paris": {
    "lat": 48.8643133,
    "lng": 2.2978602,
    "city": "Paris",
    "state": "France",
    "coordinate_source": "https://www.openstreetmap.org/way/79219308"
  },
  "The Amistad Center for Art & Culture / Wadsworth Atheneum": {
    "lat": 41.7634633,
    "lng": -72.6729015,
    "city": "Hartford",
    "state": "CT",
    "coordinate_source": "https://www.openstreetmap.org/relation/12429125"
  },
  "The Studio Museum in Harlem": {
    "lat": 40.8084179,
    "lng": -73.947616,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/node/5420936939"
  },
  "Michener Art Museum": {
    "lat": 40.3085531,
    "lng": -75.126051,
    "city": "Doylestown",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/275092258"
  },
  "American Swedish Historical Museum": {
    "lat": 39.9059549,
    "lng": -75.1809348,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/relation/4141515"
  },
  "Charles H. Wright Museum of African American History": {
    "lat": 42.3591272,
    "lng": -83.060828,
    "city": "Detroit",
    "state": "MI",
    "coordinate_source": "https://www.openstreetmap.org/way/68957303"
  },
  "Museum of the American Revolution": {
    "lat": 39.9483709,
    "lng": -75.1458446,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/node/4150740083"
  },
  "Brandywine Museum of Art": {
    "lat": 39.8699798,
    "lng": -75.593038,
    "city": "Chadds Ford",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/187353021"
  },
  "Delaware Art Museum": {
    "lat": 39.7655725,
    "lng": -75.5646368,
    "city": "Wilmington",
    "state": "DE",
    "coordinate_source": "https://www.openstreetmap.org/way/85540782"
  },
  "Reading Public Museum": {
    "lat": 40.3273423,
    "lng": -75.9513453,
    "city": "Reading",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/239133425"
  },
  "New York Transit Museum": {
    "lat": 40.6905176,
    "lng": -73.9899802,
    "city": "Brooklyn",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/node/368061648"
  },
  "Tenement Museum": {
    "lat": 40.7187837,
    "lng": -73.9900266,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/node/368061660"
  },
  "Museum of Modern Art (MoMA)": {
    "lat": 40.7616124,
    "lng": -73.9774992,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/way/278346578"
  },
  "National Museum of Asian Art": {
    "lat": 38.8881222,
    "lng": -77.0276002,
    "city": "Washington",
    "state": "DC",
    "coordinate_source": "https://www.openstreetmap.org/relation/1029355"
  },
  "National Gallery of Art": {
    "lat": 38.8913116,
    "lng": -77.0199045,
    "city": "Washington",
    "state": "DC",
    "coordinate_source": "https://www.openstreetmap.org/way/66418944"
  },
  "National Museum of Women in the Arts": {
    "lat": 38.9000261,
    "lng": -77.0292709,
    "city": "Washington",
    "state": "DC",
    "coordinate_source": "https://www.openstreetmap.org/node/367144504"
  },
  "Library of Congress": {
    "lat": 38.8886737,
    "lng": -77.004636,
    "city": "Washington",
    "state": "DC",
    "coordinate_source": "https://www.openstreetmap.org/relation/1029374"
  },
  "The People’s House": {
    "lat": 38.8985861,
    "lng": -77.039735,
    "city": "Washington",
    "state": "DC",
    "coordinate_source": "https://www.openstreetmap.org/node/687369381"
  },
  "Isabella Stewart Gardner Museum": {
    "lat": 42.338245,
    "lng": -71.0991538,
    "city": "Boston",
    "state": "MA",
    "coordinate_source": "https://www.openstreetmap.org/way/29650851"
  },
  "Weitzman National Museum of American Jewish History": {
    "lat": 39.9502265,
    "lng": -75.1484628,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/333012771"
  },
  "Fireman’s Hall Museum": {
    "lat": 39.9532957,
    "lng": -75.1428054,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/338550400"
  },
  "The Morgan Library & Museum": {
    "lat": 40.7492685,
    "lng": -73.9814652,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/node/4462440249"
  },
  "Brooklyn Museum": {
    "lat": 40.6709546,
    "lng": -73.9632948,
    "city": "Brooklyn",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/way/1432069915"
  },
  "Solomon R. Guggenheim Museum": {
    "lat": 40.7829932,
    "lng": -73.958925,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/way/170149134"
  },
  "Institute of Contemporary Art/Boston": {
    "lat": 42.3528651,
    "lng": -71.0429628,
    "city": "Boston",
    "state": "MA",
    "coordinate_source": "https://www.openstreetmap.org/way/117888922"
  },
  "Shelburne Museum": {
    "lat": 44.3736821,
    "lng": -73.2323474,
    "city": "Shelburne",
    "state": "VT",
    "coordinate_source": "https://www.openstreetmap.org/way/188662505"
  },
  "MASS MoCA": {
    "lat": 42.7012857,
    "lng": -73.1158854,
    "city": "North Adams",
    "state": "MA",
    "coordinate_source": "https://www.openstreetmap.org/way/225074313"
  },
  "Baltimore Museum of Art": {
    "lat": 39.3258182,
    "lng": -76.6197227,
    "city": "Baltimore",
    "state": "MD",
    "coordinate_source": "https://www.openstreetmap.org/way/114709357"
  },
  "Walters Art Museum": {
    "lat": 39.2970043,
    "lng": -76.616017,
    "city": "Baltimore",
    "state": "MD",
    "coordinate_source": "https://www.openstreetmap.org/way/1155100625"
  },
  "Yale Center for British Art": {
    "lat": 41.3078959,
    "lng": -72.9308614,
    "city": "New Haven",
    "state": "CT",
    "coordinate_source": "https://www.openstreetmap.org/way/139753883"
  },
  "Carnegie Museum of Art": {
    "lat": 40.4437092,
    "lng": -79.9490541,
    "city": "Pittsburgh",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/way/31899525"
  },
  "Dallas Museum of Art": {
    "lat": 32.7872922,
    "lng": -96.8004979,
    "city": "Dallas",
    "state": "TX",
    "coordinate_source": "https://www.openstreetmap.org/relation/6942581"
  },
  "Museum for Art in Wood": {
    "lat": 39.9533851,
    "lng": -75.1448564,
    "city": "Philadelphia",
    "state": "PA",
    "coordinate_source": "https://www.openstreetmap.org/node/12235452452"
  },
  "Beinecke Rare Book & Manuscript Library": {
    "lat": 41.3115974,
    "lng": -72.9273243,
    "city": "New Haven",
    "state": "CT",
    "coordinate_source": "https://www.openstreetmap.org/way/114134159"
  },
  "Hirshhorn Museum and Sculpture Garden": {
    "lat": 38.8881647,
    "lng": -77.023257,
    "city": "Washington",
    "state": "DC",
    "coordinate_source": "https://www.openstreetmap.org/relation/3374667"
  },
  "State Historical Society of Missouri": {
    "lat": 38.9488319,
    "lng": -92.3303585,
    "city": "Columbia",
    "state": "MO",
    "coordinate_source": "https://www.openstreetmap.org/way/547545610"
  },
  "New York Transit Museum Grand Central Gallery": {
    "lat": 40.7526944,
    "lng": -73.977253,
    "city": "New York",
    "state": "NY",
    "coordinate_source": "https://www.openstreetmap.org/way/265947358",
    "location_note": "Terminal building location; gallery is in the Shuttle Passage."
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

    if (!status) {
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
  actionStatus.textContent = status === "Not interested"
    ? "Exhibition moved to Archive. You can restore it at the bottom of the page."
    : "Personal status updated.";

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

function isArchived(exhibition) {
  return exhibition.user_status === "Not interested";
}

function activeExhibitions() {
  return allExhibitions.filter((exhibition) => !isArchived(exhibition));
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

    const timingMatch = timingFilter.value === "all" || getGroup(exhibition) === timingFilter.value;
    return categoryMatch && distanceMatch && statusMatch && timingMatch;
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

function badgeClass(label) {
  return ({
    "Closing soon": "badge-closing",
    "Tickets available": "badge-tickets",
    "Unreviewed": "badge-unreviewed",
    "Interested": "badge-interested",
    "Planning": "badge-planning",
    "Attended": "badge-attended",
    "Not interested": "badge-archived"
  })[label] || "";
}

const expandedCards = new Set();

function renderCard(exhibition) {
  const article = document.createElement("article");
  article.className = "exhibition-card";
  article.dataset.exhibitionId = exhibition.exhibition_id;
  const initiallyExpanded = expandedCards.has(exhibition.exhibition_id);
  if (initiallyExpanded) article.classList.add("expanded");

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
      ${badges.map((badge) => `<span class="badge ${badgeClass(badge)}${badge === normalizedChangeLabel(exhibition) ? " attention" : ""}">${badge}</span>`).join("")}
    </div>

    <h3>${exhibition.exhibition_title}</h3>
    <p class="location">${shortMuseum(exhibition.institution_name)} · ${shortCity(exhibition.city)}</p>
    <p class="dates">${formatDate(exhibition.opening_date)} → ${formatDate(exhibition.closing_date)}</p>
    <p class="ticket-status"><strong>Ticket status:</strong> ${exhibition.ticket_status || "Unknown"}</p>
    <p class="summary">${exhibition.why_relevant || exhibition.short_description || ""}</p>

    <button
      class="card-toggle"
      type="button"
      aria-expanded="${initiallyExpanded ? "true" : "false"}"
      aria-controls="${detailId}"
    >
      ${initiallyExpanded ? "Hide details" : "View details"}
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
              <option value="Not interested"${isArchived(exhibition) ? " selected" : ""}>Not interested</option>
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
      const updatedCard = [...document.querySelectorAll(".exhibition-card")]
        .find((card) => card.dataset.exhibitionId === String(exhibition.exhibition_id));
      if (updatedCard) updatedCard.querySelector(".card-toggle").focus();
    });
  }

  statusSelect.addEventListener("change", (event) => {
    const archived = event.target.value === "Not interested";
    updateExhibitionStatus(
      exhibition.exhibition_id,
      event.target.value
    );
    if (archived) {
      document.querySelector("#archive-title").focus();
    } else {
      const updatedControl = [...document.querySelectorAll(".personal-status-select")]
        .find((control) => control.dataset.exhibitionId === String(exhibition.exhibition_id));
      if (updatedControl) updatedControl.focus();
    }
  });

  toggle.addEventListener("click", () => {
    const expanded = article.classList.toggle("expanded");
    if (expanded) expandedCards.add(exhibition.exhibition_id);
    else expandedCards.delete(exhibition.exhibition_id);
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.textContent = expanded ? "Hide details" : "View details";
  });

  if (isArchived(exhibition)) {
    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "restore-button";
    restore.textContent = "Restore to radar";
    restore.addEventListener("click", () => {
      updateExhibitionStatus(exhibition.exhibition_id, "None");
      actionStatus.textContent = "Exhibition restored to your active radar.";
      document.querySelector("#archive-title").focus();
    });
    article.append(restore);
  }
  return article;
}

const expandedGroups = new Set();

function renderGroup(title, exhibitions) {
  if (!exhibitions.length) return null;

  const section = document.createElement("details");
  section.className = "exhibition-group";
  section.dataset.group = title;
  section.open = expandedGroups.has(title);
  section.addEventListener("toggle", () => {
    if (!section.isConnected) return;
    if (section.open) expandedGroups.add(title);
    else expandedGroups.delete(title);
  });

  const heading = document.createElement("summary");
  heading.className = "group-heading";

  heading.innerHTML = `
    <h2>${title}</h2>
    <span class="count">${exhibitions.length}</span>
    <span class="group-chevron" aria-hidden="true">⌄</span>
  `;

  const cards = document.createElement("div");
  cards.className = "group-cards";
  cards.replaceChildren(...exhibitions.map(renderCard));

  section.append(heading, cards);

  return section;
}

function renderArchive() {
  const archived = allExhibitions.filter(isArchived);
  archiveCount.textContent = archived.length;
  archiveList.replaceChildren(...archived.map(renderCard));
  if (!archived.length) archiveList.innerHTML = '<div class="empty">No archived exhibitions yet.</div>';
}

function renderUpcoming() {
  listEl.querySelectorAll("details.exhibition-group").forEach((group) => {
    if (group.open) expandedGroups.add(group.dataset.group);
    else expandedGroups.delete(group.dataset.group);
  });
  renderArchive();
  const exhibitions = filterExhibitions(activeExhibitions());

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

  statusEl.textContent = `${exhibitions.length} of ${activeExhibitions().length} active exhibitions shown`;

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

  activeExhibitions().forEach((exhibition) => {
    pushEvent(exhibition.opening_date, exhibition, "Opens");
    pushEvent(exhibition.closing_date, exhibition, "Closes");
  });

  return events;
}


function buildUpcomingMilestones(limit = 12) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const milestones = [];

  activeExhibitions().forEach((exhibition) => {
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

  activeExhibitions().forEach((exhibition) => {
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
      ${group.location.location_note ? `<p>${group.location.location_note}</p>` : ""}
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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
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
    ], { title: group.institution, alt: group.institution });

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
    `${institutions.length} institutions · ${exhibitionCount} of ${activeExhibitions().length} active exhibitions mapped`;
  const unmapped = [...new Set(activeExhibitions()
    .filter((exhibition) => !museumLocations[exhibition.institution_name])
    .map((exhibition) => exhibition.institution_name))];
  document.querySelector("#map-coverage-note").textContent = unmapped.length
    ? `Not mapped (location needed): ${unmapped.join("; ")}. These exhibitions remain in Upcoming and Calendar.`
    : "All active exhibitions have museum locations. Museum pins group exhibitions at the same institution.";

  requestAnimationFrame(() => {
    museumMap.invalidateSize();
  });
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

[categoryFilter, distanceFilter, statusFilter, timingFilter].forEach((control) => {
  control.addEventListener("change", renderUpcoming);
});

clearFiltersButton.addEventListener("click", () => {
  categoryFilter.value = "all";
  distanceFilter.value = "all";
  statusFilter.value = "all";
  timingFilter.value = "all";
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
