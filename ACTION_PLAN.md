# Action Plan — Fixes & Features (Single Plan)

**Created:** March 2025  
**Audience:** Intern software developer  
**Scope:** Bug fixes, consistency, security + 4 feature areas (transfer inquiry, campaign/WhatsApp sync, time analytics, admin no-reply notifications).

---

## Overview

### Part A — Fixes (existing issues)

| Phase | Focus | Est. total |
|-------|--------|------------|
| 1 | High priority: upload folder, lint, dialog reset | ~1 h 5 m |
| 2 | Medium: approval status, body size, folder in callers | ~1 h |
| 3 | Low: CSP, migration naming | ~1.5–2.5 h |

**Fixes total:** ~3.5–4.5 hours

### Part B — New features

| # | Feature | Est. total | Complexity |
|---|---------|------------|------------|
| B1 | Transfer inquiry to another coordinator (admin approval) | 8–12 h | Medium |
| B2 | Auto-fetch campaign data & WhatsApp messages into CRM | 12–20 h | Medium–High |
| B3 | Analytics: study time, implementation time, test time | 6–10 h | Medium |
| B4 | Admin dashboard: notify when coordinator doesn’t reply | 10–16 h | Medium |

**Features total:** ~36–58 hours

---

# Part A — Fixes

## A.1 Phase 1: High priority (bugs & tooling)

### A.1.1 Fix upload API to respect `folder` parameter

| Field | Detail |
|-------|--------|
| **Estimate** | 30 min |
| **Files** | `src/app/api/upload/route.ts` |
| **Status** | ⬜ Not started |

**Actions:**

- [ ] Read `folder` from `request.formData()` (e.g. `formData.get('folder')`).
- [ ] Validate/sanitize: allow only alphanumeric + hyphen (e.g. `posts`, `campaigns`, `editor`); default to `campaigns` if missing or invalid.
- [ ] Pass the resolved `folder` to `uploadToS3(file, folder)`.
- [ ] Use the same `folder` for local storage: `MEDIA_UPLOAD_DIR` or path should include `folder` (e.g. `public/uploads/{folder}`) instead of hardcoding `campaigns`.
- [ ] Add a short comment that new-post-dialog sends `folder: 'posts'` and other callers may omit it (default `campaigns`).
- [ ] Manually test: create a new post, upload image, confirm file is under `posts` (S3 or local); test campaign/other upload still uses `campaigns`.

---

### A.1.2 Fix lint script in package.json

| Field | Detail |
|-------|--------|
| **Estimate** | 15 min |
| **Files** | `package.json` |
| **Status** | ⬜ Not started |

**Actions:**

- [ ] Change `"lint": "eslint"` to `"lint": "next lint"` (recommended for Next.js) **or** to `"lint": "eslint . --max-warnings 0"` if using only ESLint.
- [ ] Run `npm run lint` and fix any new failures (if you introduce `--max-warnings 0`).
- [ ] Optionally add `"lint:fix": "next lint --fix"` or `eslint . --fix` for auto-fix.

---

### A.1.3 Reset new post dialog on Cancel/close

| Field | Detail |
|-------|--------|
| **Estimate** | 20 min |
| **Files** | `src/components/posts/new-post-dialog.tsx` |
| **Status** | ⬜ Not started |

**Actions:**

- [ ] When the dialog closes (e.g. in `onOpenChange` when `open` becomes `false`), call `resetForm()` so caption, media, approvers, and URL fields are cleared.
- [ ] Ensure closing via Cancel, X, or overlay click all go through the same `onOpenChange(false)` path so reset runs in one place.
- [ ] Test: open dialog, fill fields, cancel → reopen and confirm form is empty.

---

## A.2 Phase 2: Medium priority (consistency & config)

### A.2.1 Simplify post approval status in API

| Field | Detail |
|-------|--------|
| **Estimate** | 15 min |
| **Files** | `src/app/api/posts/route.ts` |
| **Status** | ⬜ Not started |

**Actions:**

- [ ] Replace `status: index === 0 ? 'PENDING' : 'PENDING'` with `status: 'PENDING'`.
- [ ] Run tests or smoke-test post creation and approval flow.

---

### A.2.2 Align upload route with 10 MB body size

| Field | Detail |
|-------|--------|
| **Estimate** | 30 min |
| **Files** | `src/app/api/upload/route.ts`, `next.config.ts` (if needed) |
| **Status** | ⬜ Not started |

**Actions:**

- [ ] Check Next.js 15 docs for Route Handler body size (formData) and whether it can be set per-route or only globally.
- [ ] If route has a default limit < 10 MB, either: increase global limit for API routes if available, or document that uploads must stay under the framework limit (e.g. 4.5 MB) and set `MAX_FILE_SIZE_BYTES` to match.
- [ ] Ensure `MAX_FILE_SIZE_BYTES` (10 MB) and any framework limit are documented in code or README so future changes don’t break large uploads.

---

### A.2.3 Use `folder` consistently in upload callers

| Field | Detail |
|-------|--------|
| **Estimate** | 15 min |
| **Files** | `src/components/ui/image-upload.tsx`, `src/components/ui/advanced-rich-text-editor.tsx` |
| **Status** | ⬜ Not started (do after A.1.1) |

**Actions:**

- [ ] After A.1.1 is done: in `image-upload.tsx`, add `formData.append('folder', 'campaigns')` (or the appropriate folder) when calling `/api/upload`, if that component is used for campaigns.
- [ ] In `advanced-rich-text-editor.tsx`, add `formData.append('folder', 'editor')` (or the appropriate folder) when calling `/api/upload`.
- [ ] Confirm new-post-dialog already sends `folder: 'posts'` and that uploads from it land under `posts`.

---

## A.3 Phase 3: Low priority (security & housekeeping)

### A.3.1 Tighten CSP (optional)

| Field | Detail |
|-------|--------|
| **Estimate** | 1–2 hrs |
| **Files** | `next.config.ts` |
| **Status** | ⬜ Not started |

**Actions:**

- [ ] Identify which scripts require `'unsafe-inline'` / `'unsafe-eval'` (e.g. Next.js, analytics, dev tools).
- [ ] Introduce nonces or hashes for script (and optionally style) CSP and remove `'unsafe-inline'` / `'unsafe-eval'` where possible.
- [ ] Test login, upload, post creation, and any third-party scripts in production-like mode.
- [ ] Document any remaining relaxations and why they’re needed.

---

### A.3.2 Migration folder naming (optional)

| Field | Detail |
|-------|--------|
| **Estimate** | 5 min |
| **Files** | `prisma/migrations/20260306100000_add_post_video_media/` |
| **Status** | ⬜ Not started |

**Actions:**

- [ ] If the migration has **not** been applied in production/staging: rename folder to a 2025 timestamp (e.g. `20250306100000_add_post_video_media`) and adjust migration history if your workflow requires it.
- [ ] If the migration **has** been applied: leave the folder name as-is to avoid breaking migration history; optionally add a one-line comment in the migration file that the 2026 prefix was a typo.

---

# Part B — New features

---

## B.1 Transfer inquiry to another coordinator (with admin approval)

**What we’re building:** Coordinator (or admin) can **request** to transfer an inquiry to another coordinator. Only **admin** can **approve** the transfer. After approval, the inquiry’s owner changes so the new coordinator sees it.

**Current state:** Seeker has `createdById`; Assignment links seeker ↔ coordinator. No primary coordinator or transfer flow.

**Approach:** Add `assignedToId` on Seeker; add `InquiryTransferRequest` (seekerId, fromUserId, requestedToUserId, status PENDING/APPROVED/REJECTED). APIs: create request, approve, reject (admin only). On approve: set `Seeker.assignedToId`, create Assignment if needed.

### B.1.1 Schema & DB (Est. 2–3 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 1 | Add `assignedToId` (optional) to `Seeker` in `prisma/schema.prisma`. Add relation to User (e.g. `assignedTo`). | 20 m | ⬜ |
| 2 | Create model `InquiryTransferRequest`: id, seekerId, fromUserId, requestedToUserId, status (enum: PENDING, APPROVED, REJECTED), reason (optional), requestedAt, decidedAt, decidedById. | 30 m | ⬜ |
| 3 | Create migration: `npx prisma migrate dev --name add_inquiry_transfer`. Fix any errors. | 20 m | ⬜ |
| 4 | (Optional) Backfill: set `assignedToId = createdById` for existing Seekers where `assignedToId` is null. | 15 m | ⬜ |

### B.1.2 API (Est. 3–4 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 5 | Create `POST /api/inquiries/[id]/transfer-request`: body `{ requestedToUserId, reason? }`. Auth required. Check seeker exists and user is allowed. Create `InquiryTransferRequest` with status PENDING. | 45 m | ⬜ |
| 6 | Create `GET /api/inquiries/[id]/transfer-requests`: list transfer requests for that inquiry (admin or assigned coordinator). | 30 m | ⬜ |
| 7 | Create `POST /api/inquiries/transfer-requests/[requestId]/approve`: admin only. Set status APPROVED, set `Seeker.assignedToId`, create Assignment if needed. Optionally notify new coordinator. | 45 m | ⬜ |
| 8 | Create `POST /api/inquiries/transfer-requests/[requestId]/reject`: admin only. Set status REJECTED. | 20 m | ⬜ |
| 9 | Update inquiry list: for non-admin, filter by `createdById = user.id OR assignedToId = user.id`. | 30 m | ⬜ |

### B.1.3 UI (Est. 3–5 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 10 | On inquiry detail/list: “Request transfer” button → modal (select “Transfer to”, optional “Reason”). Submit to POST transfer-request. | 1 h | ⬜ |
| 11 | Admin-only: “Pending transfer requests” list with Approve/Reject. | 1–1.5 h | ⬜ |
| 12 | Show “Assigned to: [Name]” on inquiry detail; badge “Transfer requested” if pending. | 30 m | ⬜ |
| 13 | (Optional) Notify new coordinator when transfer approved (e.g. type `INQUIRY_TRANSFERRED`). | 30 m | ⬜ |

---

## B.2 Auto-fetch campaign data and WhatsApp messages into CRM

**What we’re building:** Sync campaign data from an external source (e.g. Meta/Google Ads) into the CRM; sync incoming WhatsApp messages so coordinators see conversation history.

**Approach:** Campaign: cron or “Sync” button calling external API, upsert into Campaign (add `externalId` if needed). WhatsApp: webhook (or polling) → new table `WhatsAppIncomingMessage` → show thread on inquiry detail.

### B.2.1 Design & config (Est. 2–3 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 1 | Decide campaign source (Meta Ads, Google Ads, etc.). Document env vars (e.g. `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`). | 30 m | ⬜ |
| 2 | Decide WhatsApp provider. Read webhook docs. List env vars and webhook URL. | 1 h | ⬜ |
| 3 | (Optional) Add “Integration” / “Sync status” table: lastRunAt, lastSuccessAt, lastError. | 30 m | ⬜ |

### B.2.2 Campaign sync (Est. 4–6 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 4 | Create `scripts/sync-campaigns.ts` or `POST /api/cron/sync-campaigns` (secret header): call external API, map to Campaign schema. | 1.5 h | ⬜ |
| 5 | Implement upsert by external id; update name, dates, budget, reach, views. | 1 h | ⬜ |
| 6 | Add migration if needed. Test with one campaign. | 30 m | ⬜ |
| 7 | Schedule job (Vercel Cron or external cron). Document in README. | 30 m | ⬜ |
| 8 | (Optional) Admin UI: “Sync campaigns” button + last sync time. | 1 h | ⬜ |

### B.2.3 WhatsApp messages (Est. 4–8 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 9 | Add table `WhatsAppIncomingMessage`: fromPhone, toPhone, messageId, text, mediaUrl?, receivedAt, seekerId?, processedAt. | 30 m | ⬜ |
| 10 | Implement `POST /api/webhooks/whatsapp`: verify signature, parse body, save to table, link seekerId by phone. Return 200 quickly. | 1.5 h | ⬜ |
| 11 | (Optional) `GET /api/inquiries/[id]/whatsapp-messages` (outgoing + incoming). | 1 h | ⬜ |
| 12 | UI: On inquiry detail, show “WhatsApp thread” (outgoing + incoming by time). | 1–2 h | ⬜ |
| 13 | (Optional) Update `WhatsAppRecipient.status` (delivery/read) from webhook if provider supports it. | 30 m–1 h | ⬜ |

---

## B.3 Analytics: study time, implementation time, test time

**What we’re building:** Track time in three modes (study, implementation, test). Show “This week: X h study, Y h implementation, Z h test”.

**Approach:** Add `TimeLog` (userId, type: STUDY | IMPLEMENTATION | TEST, minutes, logDate, description?). API: POST/GET time-logs. UI: “Log time” form + “My time” page + summary/chart.

### B.3.1 Schema & API (Est. 2–3 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 1 | Add model `TimeLog`: id, userId, type (enum), minutes, logDate, description?, taskId?, createdAt. | 20 m | ⬜ |
| 2 | Create `POST /api/time-logs`: body { type, minutes, logDate?, description? }. userId from auth. | 30 m | ⬜ |
| 3 | Create `GET /api/time-logs`: query params userId (admin), dateFrom, dateTo, type. Return list + optional totals. | 45 m | ⬜ |
| 4 | (Optional) `DELETE /api/time-logs/[id]`: owner or admin. | 15 m | ⬜ |

### B.3.2 UI (Est. 2–4 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 5 | “Log time” form: Type, Duration (e.g. 15 min / 1 h), Date, Description. Submit to POST. | 45 m | ⬜ |
| 6 | “My time” page: list of recent logs; filter by week/month and type. | 1 h | ⬜ |
| 7 | Summary cards or chart: “This week: X h study, Y h implementation, Z h test.” | 1 h | ⬜ |
| 8 | (Optional) Link to task (taskId) and show in list. | 30 m | ⬜ |

---

## B.4 Admin dashboard: notify when coordinator doesn’t reply

**What we’re building:** If a coordinator has not “replied” to an inquiry (e.g. no Interaction within 24 h), **admin** gets a **special notification** (in-app + optional push).

**Definition:** “Replied” = at least one Interaction for that seeker. “No reply” = Seeker created > N hours ago, not deleted, no Interaction. Owner = `assignedToId ?? createdById`.

**Approach:** New type `COORDINATOR_NO_REPLY`; cron job finds no-reply seekers, (optional) dedupe with `NoReplyAlert` table, creates notifications for all admins; admin bell + optional “No-reply inquiries” view.

### B.4.1 Schema & notification type (Est. 1–2 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 1 | Add `COORDINATOR_NO_REPLY` to `NotificationType` in Prisma and notification-service. Add optional seekerId/meta to Notification for link. | 30 m | ⬜ |
| 2 | (Optional) Add table `NoReplyAlert`: seekerId, coordinatorId, firstAlertAt, lastAlertAt. | 30 m | ⬜ |
| 3 | Run migration. Update createNotification for new type and link (e.g. `/inquiries?id=...`). | 20 m | ⬜ |

### B.4.2 Detection job (Est. 3–4 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 4 | Create `getSeekersWithNoReply(hoursOld)`: Seekers where createdAt < now - hoursOld, isDeleted = false, no Interaction; return with owner. | 1 h | ⬜ |
| 5 | Create `POST /api/cron/check-no-reply`: call getSeekersWithNoReply(24); for each, check NoReplyAlert; if not recently alerted, create notification for all admins. | 1.5 h | ⬜ |
| 6 | Insert into NoReplyAlert (if used). | 30 m | ⬜ |
| 7 | Schedule route (e.g. Vercel Cron every 6 h). Secure with secret header. | 30 m | ⬜ |

### B.4.3 Admin UI (Est. 2–3 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 8 | Notification bell/list: show `COORDINATOR_NO_REPLY` with distinct icon/color and title. | 30 m | ⬜ |
| 9 | Clicking notification opens inquiry list filtered by seeker or “No-reply inquiries” view. | 45 m | ⬜ |
| 10 | (Optional) Admin dashboard widget: “Inquiries with no reply (24h)” count + link. | 30 m | ⬜ |

### B.4.4 WhatsApp “no reply” (optional, Est. 2–4 h)

| Step | Task | Est. | Done |
|------|------|------|------|
| 11 | Define “WhatsApp not replied”: last outgoing message to seeker > 24 h ago, no Interaction since. | 30 m | ⬜ |
| 12 | In same cron, find these seekers; create `WHATSAPP_NO_REPLY` notifications for admins. | 1 h | ⬜ |
| 13 | Show in admin bell and “No reply” view. | 30 m | ⬜ |

---

# Unified checklist

## Part A — Fixes

| Id | Task | Est. | Done |
|----|------|------|------|
| A.1.1 | Upload API respect `folder` | 30 m | ⬜ |
| A.1.2 | Fix lint script | 15 m | ⬜ |
| A.1.3 | Reset new post dialog on close | 20 m | ⬜ |
| A.2.1 | Simplify approval status in posts API | 15 m | ⬜ |
| A.2.2 | Upload route body size alignment | 30 m | ⬜ |
| A.2.3 | Consistent `folder` in upload callers | 15 m | ⬜ |
| A.3.1 | CSP tightening (optional) | 1–2 h | ⬜ |
| A.3.2 | Migration naming (optional) | 5 m | ⬜ |

## Part B — Features

| Id | Feature | Est. | Done |
|----|---------|------|------|
| B.1 | Transfer inquiry (schema + API + UI) | 8–12 h | ⬜ |
| B.2 | Campaign + WhatsApp sync | 12–20 h | ⬜ |
| B.3 | Time analytics (study / impl / test) | 6–10 h | ⬜ |
| B.4 | Admin no-reply notifications | 10–16 h | ⬜ |

---

# Suggested execution order

**Fixes first (Part A):**

1. **A.1.2** (lint) — quick win.
2. **A.1.1** (upload folder) — unblocks A.2.3.
3. **A.1.3** (dialog reset).
4. **A.2.1** (approval status).
5. **A.2.3** (folder in callers) — after A.1.1.
6. **A.2.2** (body size).
7. **A.3.1**, **A.3.2** when you have time.

**Features (Part B) — intern-friendly order:**

1. **B.3** (Time analytics) — small scope, no external APIs; good first feature.
2. **B.1** (Transfer inquiry) — core domain and RBAC.
3. **B.4** (Admin no-reply) — reuses notification system and cron.
4. **B.2** (Campaign + WhatsApp sync) — after external API and webhook decisions.

---

# Quick reference — new/updated files

| Area | Files (examples) |
|------|------------------|
| A.1.1 | `src/app/api/upload/route.ts` |
| A.1.2 | `package.json` |
| A.1.3 | `src/components/posts/new-post-dialog.tsx` |
| A.2.1 | `src/app/api/posts/route.ts` |
| A.2.3 | `src/components/ui/image-upload.tsx`, `advanced-rich-text-editor.tsx` |
| B.1 | `prisma/schema.prisma` (Seeker.assignedToId, InquiryTransferRequest), `src/app/api/inquiries/[id]/transfer-request/route.ts`, `.../transfer-requests/[id]/approve|reject/route.ts`, transfer UI |
| B.2 | `scripts/sync-campaigns.ts` or `src/app/api/cron/sync-campaigns/route.ts`, `src/app/api/webhooks/whatsapp/route.ts`, `WhatsAppIncomingMessage` model |
| B.3 | `TimeLog` model, `src/app/api/time-logs/route.ts`, time-log page + form |
| B.4 | Notification type, `getSeekersWithNoReply`, `src/app/api/cron/check-no-reply/route.ts`, optional `NoReplyAlert`, admin UI |

---

# Notes

- After each task, run `npm run lint` and a quick manual test.
- Use feature branches per phase or per feature for easier review.
- Adjust time estimates after your first feature; use this doc as a living plan and tick off items as you go.
