# Museum Radar

Museum Radar is a lightweight visual system for discovering, tracking, and planning museum exhibitions that match defined interests.

## Current status

**Museum Radar v1 interface is built and QA-tested.**

Working views and behaviors include:

- **Upcoming** — chronological exhibition browsing with category, distance, and status/attention filters
- **Calendar** — opening and closing milestones, with **OPENS in green** and **CLOSES in red**
- **Upcoming Dates** — the next 12 opening/closing milestones in chronological order with light year dividers
- **Map** — museum-level geographic awareness
- **Expandable exhibition cards** — richer context, links, ticket information, notes, and personal status
- **Unreviewed** — persistent review/inbox state until an exhibition is explicitly marked reviewed
- **Personal status** — None, Interested, Planning, and Attended

Personal status and review acknowledgement currently persist in the browser via `localStorage`.

## Source-of-truth architecture

- **Museum Radar Seed Dataset v1.xlsx** — authoritative exhibition data
- **Museum Radar Blueprint v1.docx** — authoritative operating rules, architecture, UX decisions, and governance
- **`data/exhibitions.json`** — runtime data consumed by the static app
- **README.md** — technical/run instructions and repository orientation
- ChatGPT conversations are a research and monitoring layer, **not** the Museum Radar database

## Repository structure

```text
Museum-Radar/
├── README.md
├── .gitignore
├── data/
│   └── exhibitions.json
├── docs/
│   └── museum-radar-blueprint.md
└── app/
    ├── index.html
    ├── style.css
    └── script.js
```

## Run locally

From the local `Museum-Radar` folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/app/
```

If updated files appear stale, hard-refresh the browser with `Ctrl + Shift + R`.

## Technical implementation

Museum Radar v1 is a static HTML/CSS/JavaScript application.

- App data: `data/exhibitions.json`
- Browser-local state: `localStorage`
- Map: Leaflet + OpenStreetMap
- Source control: GitHub
- Deployment: Netlify from the GitHub repository

## Next phase

Connect the authoritative Microsoft Excel Seed Dataset to a repeatable data pipeline that updates `data/exhibitions.json` and supports recurring research → structured record creation/update.

Major new UI features should wait until this data path is reliable.
