# MPLADS Sentinel

**AI-Powered Monitoring & Analytics Platform for the MPLAD Scheme**
Smart India Hackathon 2026 — Problem Statement SIH26102 (Ministry: MoSPI)

> **Disclaimer:** All data in this application is **SYNTHETIC DEMO DATA** — generated for prototype purposes for SIH 2026. It is not connected to live MPLADS systems.

## Overview

MPLADS Sentinel is a full-stack anomaly detection and monitoring platform that helps ministry, state, district, and MP-level stakeholders detect fraud, cost overruns, and inefficiencies in MPLAD Scheme implementation.

It ingests work records, runs 7 statistical/rule-based anomaly detection rules, computes a composite 0–100 risk score per work, and surfaces findings through four role-based dashboards, a global works register, and a chronological alerts feed.

## Architecture

This project uses a **Vite + React + TypeScript** frontend with **MongoDB Atlas** as the data store (the M in MERN). The browser talks to MongoDB Atlas via the **Data API** — a REST endpoint that lets the frontend CRUD documents directly without a separate Express server.

The anomaly-detection engine, seed data generator, and all dashboards run entirely on open-source dependencies with no external paid APIs.

```
src/
├── lib/
│   ├── types.ts          # TypeScript domain types (Work, ScoredWork, Alert, etc.)
│   ├── format.ts         # INR / date / number formatting helpers
│   ├── seed.ts           # Synthetic dataset generator (~285 works, 16 states, 18 contractors)
│   ├── anomaly.ts        # Anomaly detection engine (7 rules, risk scoring, aggregations)
│   ├── mongo.ts          # MongoDB Atlas Data API client
│   ├── localStore.ts     # localStorage fallback (used when MongoDB env vars are absent)
│   ├── useWorksData.ts   # React hook: load/seed works, client-side scoring, review actions
│   └── csv.ts            # CSV export utility
├── components/
│   ├── Layout.tsx        # Sidebar navigation + government-dashboard shell
│   ├── StatCard.tsx      # KPI card
│   ├── RiskBadge.tsx     # Critical/High/Medium/Low badge
│   ├── StatusBadge.tsx   # Work status + review state badges
│   ├── WorksTable.tsx    # Reusable works table
│   └── AlertCard.tsx     # Alert feed card
└── pages/
    ├── MinistryOverview.tsx   # National dashboard (role 1)
    ├── StateView.tsx          # State nodal dashboard (role 2)
    ├── DistrictView.tsx       # District dashboard with review/escalate (role 3)
    ├── MPView.tsx             # MP self-monitoring dashboard (role 4)
    ├── WorksRegister.tsx      # Global searchable/filterable table
    ├── AlertsFeed.tsx         # Chronological Critical/High alert feed
    └── WorkDetail.tsx         # Full single-work record
```

## Data Model (MongoDB `works` collection)

Each document in the `works` collection stores:

- `id` (string UUID — used as the document's application-level key)
- `work_code`, `title`, `category`
- `mp_name`, `constituency`, `state`, `district`
- `implementing_agency` (contractor)
- `sanctioned_amount`, `expenditure_to_date`
- `unit_of_measure` (sqft/meter/unit), `quantity`
- `sanction_date`, `expected_completion_date`, `actual_completion_date`
- `progress_percent` (0–100)
- `status`: Recommended | Sanctioned | In Progress | Delayed | Completed | Stalled
- `completion_photo_uploaded` (boolean)
- `review_state`: pending | reviewed | escalated (District Authority actions)
- `risk_score` and `flagged_rules` are **computed at runtime** by the anomaly engine (not stored)

## Anomaly Detection Rules

Each rule contributes points to a composite 0–100 risk score:

| # | Rule | Points | Trigger |
|---|------|--------|---------|
| 1 | Cost Overrun | 22 | Expenditure exceeds sanction by >15% |
| 2 | Cost/Unit Outlier | 25 | Modified Z-score (MAD-based) > 3.5 vs category peers |
| 3 | Payment Ahead of Progress | 18 | Expenditure % of sanction > progress % by >20pp |
| 4 | Delayed | 15 | Past expected completion date and not Completed |
| 5 | Stalled | 16 | No progress + status unchanged ≥90 days |
| 6 | Duplicate-Suspect | 20 | Same category + contractor + district + fiscal year (excludes "Phase N" variants) |
| 7 | Completion Without Evidence | 12 | Completed but no photo uploaded |

**Risk levels:** Critical (80–100) · High (60–79) · Medium (30–59) · Low (0–29)

### Modified Z-Score (Rule 2)

Uses the robust **Median Absolute Deviation** method instead of standard deviation, since it is resistant to the very outliers we're trying to detect:

```
modified Z = 0.6745 × (x − median) / MAD
```

Flagged when `Z > 3.5`. Peer group = same category (minimum 5 peers).

## Setup

### Option A — MongoDB Atlas (recommended for the hackathon demo)

1. Create a free **MongoDB Atlas** cluster at <https://www.mongodb.com/atlas>.
2. In Atlas, go to **App Services** (or **Data API** in older Atlas versions) and **enable the Data API**.
3. Generate a **Data API key**.
4. Create a database called `mplads_sentinel` with a collection called `works` (the app creates it automatically on first insert, but you can pre-create it).
5. Add these environment variables to your `.env` file:

```
VITE_MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/data-xxxx/endpoint/data/v1
VITE_MONGODB_DATA_API_KEY=your-generated-api-key
VITE_MONGODB_DATA_SOURCE=Cluster0
VITE_MONGODB_DATABASE=mplads_sentinel
VITE_MONGODB_COLLECTION=works
```

6. Run:
```bash
npm install
npm run dev
```

7. On first load the collection is empty — click **"Generate Synthetic Dataset"** to seed ~285 works. The anomaly engine scores every work immediately and populates all dashboards.

### Option B — Local fallback (no setup required)

If the MongoDB env vars are absent, the app automatically falls back to **browser localStorage** so it still works for a demo or local preview. Data persists across reloads but is per-browser. The header shows "Local Storage" when in this mode and "MongoDB Atlas" when connected to your cluster.

### Scripts
- `npm run dev` — start the Vite dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript type checking
- `npm run lint` — ESLint

You can re-seed at any time via the **"Reseed Dataset"** button in the sidebar.

## Role-Based Dashboards

1. **Ministry / National Overview** — aggregate stats, state-wise risk heatmap, rule-frequency breakdown, sanction-vs-expenditure trend, top 10 flagged works, funds-at-risk chart
2. **State Nodal Authority** — pick a state, see district-wise risk breakdown + flagged works table + CSV export
3. **District Authority** — pick a district (via State view), see its works, mark flagged items as **Reviewed** or **Escalated** (persists to MongoDB)
4. **MP View** — pick an MP, see their own works, sanctioned amounts, and flagged items for self-monitoring

## Additional Features

- **Works Register** — full searchable/filterable table (by state, risk level, status, keyword on code/title/contractor/MP) with CSV export
- **Alerts Feed** — all Critical and High severity rule triggers, each with the specific rule name, numeric evidence (e.g. "Sanctioned ₹25,000/sqft vs peer median ₹2,778/sqft, modified Z-score 15.81, n=34 peers"), and a link to the full work record
- **Work Detail** — full record with financials, progress bars, all triggered rules with evidence, and review/escalate actions

## Tech Stack
- React 18 + TypeScript + Vite
- React Router (HashRouter)
- Recharts for visualizations
- Tailwind CSS for styling
- MongoDB Atlas (Data API) for data persistence, with localStorage fallback
- lucide-react for icons

## License
Prototype for Smart India Hackathon 2026. Not for production use.
