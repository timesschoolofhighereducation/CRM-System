# Dashboard Plan — Coordinator-Led Strategy

**Owner:** Lead Coordinator / Product  
**Goal:** Turn the dashboard into a **quick-analysis hub** where coordinators get the right information at a glance and can slice data with filters.  
**Principle:** Use standard, proven patterns so the dashboard is consistent, maintainable, and scalable.

---

## 1. Vision & Strategy (Lead Coordinator View)

### 1.1 What “Quick Analysis” Means Here

- **At a glance:** Key numbers (seekers, contact rate, tasks, activity) visible in &lt; 2 seconds with clear trend (vs last period).
- **One-click time context:** Presets like “Today”, “This week”, “This month”, “Last 30 days” so coordinators don’t configure dates every time.
- **Filter to answer questions:** “How many inquiries this week by program?”, “Which user had most activity last month?”, “Contact rate for last 30 days?” — all answerable from the same dashboard using filters and the same API.

### 1.2 Standard Strategy We’ll Use

| Principle | Application |
|-----------|-------------|
| **Single source of truth** | One dashboard API that accepts filter params; all widgets use the same filters. |
| **Server-side filtering** | Filters (date range, user, program, etc.) are applied in the API so we don’t over-fetch and we keep logic in one place. |
| **Progressive disclosure** | Default view = minimal filters (e.g. time preset). Advanced filters in a collapsible “Filters” bar so the default stays “quick”. |
| **Consistent filter UX** | Reuse patterns from Inquiries (date range, dropdowns, clear-all) so the app feels one product. |
| **Role-based scope** | Non-admins see only their data; admins can optionally filter by user/team. Same API, different `where` based on role + filters. |
| **URL / state** | Critical filters (e.g. date preset) in URL query so “share” and “refresh” keep the same view. |

These choices keep the dashboard predictable for the team and easier to maintain.

---

## 2. Information Architecture (What Shows Where)

### 2.1 Sections (Keep and Extend)

Keep the current high-level layout; make each section filter-aware.

| Section | Purpose | Filter-dependent? |
|--------|--------|--------------------|
| **Header** | Title + global filter bar (time preset + optional filters). | Yes — drives all data below. |
| **KPI cards (DashboardStats)** | Total Seekers, New This Week, Contact Rate, Pending Tasks (with trend vs previous period). | Yes — all respect date range (and later: user/program if needed). |
| **Recent Activity** | Last N interactions (e.g. 10–20) with channel, outcome, user. | Yes — same date range; optional filter by channel/user. |
| **User Inquiry Analytics** (admin) | Per-user inquiry counts (total, this week, this month). | Yes — same date range; optional “filter by user” for large teams. |
| **Notifications** (right column) | Unchanged; can stay as-is. | No. |

### 2.2 “Quick Analysis” Ideas (Concrete)

- **Time presets:** Buttons or dropdown: **Today | This week | This month | Last 7 days | Last 30 days | Custom**. Default e.g. “This week” so coordinators get an immediate meaningful view.
- **Comparison:** KPI cards show “vs previous period” (e.g. this week vs last week). Already partially there; ensure it’s consistent for the selected range (e.g. “Last 30 days” vs “Previous 30 days”).
- **One-click context:** Selecting a preset immediately refetches dashboard data with that range — no extra “Apply” if we want to keep it fast (or one “Apply” for custom only).
- **Optional filters (advanced):**  
  - **User** (admin): “My team” vs “All” or pick a user.  
  - **Channel:** Call, WhatsApp, Email, etc. for activity and contact-rate logic if we expose it.  
  - **Program / Campaign** (optional later): For “inquiries by program” style analysis without leaving the dashboard.

So: **quick analysis** = presets + comparison + optional filters, all feeding one API.

---

## 3. Data & API Strategy

### 3.1 Current State

- **`GET /api/dashboard`** returns: `stats`, `activities`, `userInquiryStats` (admin), `isAdmin`, `timestamp`.
- Date ranges are **hardcoded** in the API (e.g. “this week”, “this month”, “last week”).
- No query parameters for date or filters.

### 3.2 Target: Filter-Aware Dashboard API

**Endpoint:** `GET /api/dashboard`

**Query parameters (standard, consistent with rest of app):**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `range` or `preset` | string | `today` \| `this_week` \| `this_month` \| `last_7` \| `last_30` \| `custom` | `this_week` |
| `dateFrom` | ISO date | When `range=custom` | — |
| `dateTo` | ISO date | When `range=custom` | — |
| `userId` | string (optional) | Filter by user (admin only); empty = all. | — |
| `channel` | string (optional) | Filter activities (and stats if we include channel in contact logic) | — |
| `limit` | number (optional) | Max recent activities to return | 10 |

**Response:** Keep current shape; values computed using the above filters and date range.

**Backend rules:**

- Compute `startOfPeriod` / `endOfPeriod` (and previous period for comparison) from `range` + `dateFrom`/`dateTo`.
- Apply `userId` to all seeker/interaction/task queries when provided and role is admin.
- Apply `channel` to interaction-based data (recent activity, and contact rate if we define it per channel).
- Keep role-based base scope: non-admin always restricted to own data; admin can optionally narrow by `userId`.

This gives one standard way to “get dashboard data for this range and these filters” and supports quick analysis + filters.

---

## 4. Frontend Strategy (Standard Patterns)

### 4.1 Filter State

- **Single filter state** at dashboard page level (or a small context/store):
  - `preset`, `dateFrom`, `dateTo`, `userId`, `channel`.
- All dashboard children receive **filter values + `onFilterChange`** (or a dashboard context). No widget fetches with its own ad‑hoc params.

### 4.2 Data Fetching

- **One primary fetch** when filters change: e.g. `fetchDashboard({ preset, dateFrom, dateTo, userId, channel })` → `GET /api/dashboard?…`.
- **Single loading state** for the whole dashboard (or per section with a shared “filter version”).
- Consider **URL sync:** `?preset=last_30` so sharing the link or refreshing keeps the same view.

### 4.3 UI Components (Reuse & Consistency)

- **Date / preset:** Reuse date-range pattern from Inquiries (e.g. `DateRangePicker` + preset chips or a `Select` for presets). Default preset = “This week”.
- **Optional filters:** Collapsible “Filters” bar with:
  - User (admin): dropdown or combobox.
  - Channel: multi-select or chips (Call, WhatsApp, Email, etc.).
- **Clear filters:** One “Clear filters” that resets to default preset and no optional filters.
- **Empty / error:** Same patterns as rest of app (e.g. empty state copy, retry on error).

### 4.4 Widgets

- **DashboardStats:** Receives `stats` from the single API response; no direct API call. Shows trend using `change` / `changeType` from API.
- **RecentActivity:** Receives `activities` from same response; optional client-side filter by channel if we want instant toggle without refetch (or refetch for consistency).
- **UserInquiryAnalytics:** Receives `userInquiryStats`; already scoped by same API filters.

This keeps the dashboard “one request per filter change” and avoids conflicting sources of truth.

---

## 5. Implementation Phases (Suggested)

### Phase 1 — Backend: Filter-Aware API (Foundation)

1. Add query parsing in `GET /api/dashboard`: `range`/`preset`, `dateFrom`, `dateTo`.
2. Compute date bounds and “previous period” in the API; replace hardcoded week/month with these.
3. Use the computed range in all Prisma queries (seekers, interactions, tasks, user stats).
4. Add optional `userId` (admin only) and `channel`; apply in queries.
5. Keep response shape; ensure `stats` include comparison (e.g. change vs previous period) for the chosen range.
6. Add minimal tests or manual checks for preset + custom range.

**Deliverable:** Dashboard API supports presets and optional filters; frontend can stay unchanged initially (default params).

### Phase 2 — Frontend: Time Presets & Single Fetch

1. Introduce dashboard filter state: `preset` (default `this_week`), `dateFrom`, `dateTo`.
2. Add a preset bar or dropdown (Today, This week, This month, Last 7 days, Last 30 days, Custom).
3. When preset is “Custom”, show existing date-range picker (reuse from Inquiries).
4. Refactor so **one** `fetchDashboard(filters)** runs on load and on filter change; pass result as props (or context) to Stats, RecentActivity, UserInquiryAnalytics.
5. URL sync (optional): update `?preset=...` and read on load so the dashboard is shareable and refresh-safe.

**Deliverable:** Coordinators can switch time context in one click and see consistent numbers and activity.

### Phase 3 — Optional Filters & Polish

1. Add collapsible “Filters” section: User (admin), Channel.
2. Wire these to the same `fetchDashboard` and API params.
3. “Clear filters” resets to default preset and no user/channel.
4. Copy and loading states: “Showing data for Last 30 days” or “No data for this range”.
5. Optional: export or “View in Reports” link with same params for deeper analysis.

**Deliverable:** Quick analysis by time + optional filters; dashboard feels complete and consistent with the rest of the app.

### Phase 4 (Later) — Enhancements

- Program / campaign filters if product needs “inquiries by program” on the dashboard.
- Caching or stale-while-revalidate for dashboard API to make repeat visits instant.
- Simple in-memory or server cache for preset “last 30” so switching back doesn’t always refetch.

---

## 6. Success Criteria (Quick Analysis + Filters)

- **Quick analysis:** Coordinator can choose “Last 30 days” (or another preset) and see KPIs + activity in one view without configuring dates.
- **Comparison:** KPIs show clear trend vs previous period (e.g. “+12% from last week”).
- **Filters:** At least date range (preset + custom) and, after Phase 3, optional user (admin) and channel; all data (stats, activity, user analytics) respect the same filters.
- **Consistency:** Same patterns as Inquiries (date range, filter bar, clear), one API, one source of truth.
- **Performance:** One request per filter change; dashboard remains responsive (existing dynamic imports and INP fixes stay).

---

## 7. Summary

| Aspect | Decision |
|--------|----------|
| **Strategy** | Coordinator-led: quick analysis + filtered data; standard patterns and single source of truth. |
| **API** | Extend `GET /api/dashboard` with `range`/`dateFrom`/`dateTo`, optional `userId`, `channel`. |
| **Frontend** | One filter state, one fetch per change, presets + optional filters; reuse Inquiries UX. |
| **Phases** | 1) API filters, 2) Presets + single fetch (+ URL?), 3) Optional filters + polish, 4) Future enhancements. |

This plan makes the dashboard the place to get a quick, filterable view of the data coordinators care about, using a standard and maintainable approach.
