# Notifications & Security Documentation

This document describes the **notification system** implementation and the **security** measures applied to notifications and authentication.

---

## 1. Notification System

### 1.1 Overview

- **User-wise (per-user)**: Every user sees only their own notifications. The source of truth is the database; all list and badge data comes from the API.
- **Web push**: When the server creates a notification, it can send a browser push so the user gets a system pop-up even when the tab is in the background.
- **Single source of truth**: Managed notifications are stored in the database and served via `/api/notifications`. The UI (header panel and sidebar bell) reads from this API only.

### 1.2 Architecture

| Layer | Description |
|-------|-------------|
| **Database** | `Notification` model (userId, type, title, message, read, postId, etc.). `PushSubscription` model (userId, endpoint, keys, isActive). |
| **API** | `GET /api/notifications`, `GET /api/notifications/unread-count`, `POST /api/notifications/[id]/read`, `POST /api/notifications/read-all`. All require authentication and scope by `userId`. |
| **Push** | `POST /api/push/subscribe` (save subscription for current user), `DELETE /api/push/unsubscribe`, `GET /api/push/vapid-public-key`. Server uses `sendPushNotification(userId, payload)` to send web push to that user’s subscriptions only. |
| **Client** | `useApiNotifications()` hook (fetch, refetch on visibility, mark read). NotificationPanel and NotificationList use this hook. NotificationBell shows count and list; both refetch when the tab becomes visible or when the popover opens. |
| **Service worker** | `public/sw.js` handles `push` (parse payload, show notification) and `notificationclick` (open/focus app at full URL). |

### 1.3 Key Files

| Purpose | Location |
|--------|----------|
| API notifications (list, unread count) | `src/app/api/notifications/route.ts` |
| Mark one read | `src/app/api/notifications/[id]/read/route.ts` |
| Mark all read | `src/app/api/notifications/read-all/route.ts` |
| Unread count (cached) | `src/app/api/notifications/unread-count/route.ts` |
| Push subscribe (save subscription) | `src/app/api/push/subscribe/route.ts` |
| Push unsubscribe | `src/app/api/push/unsubscribe/route.ts` |
| VAPID public key | `src/app/api/push/vapid-public-key/route.ts` |
| Create notification + send push | `src/lib/notification-service.ts` |
| Send web push to a user | `src/lib/push-notification-service.ts` |
| Client push subscribe/register SW | `src/lib/push-notification-client.ts` |
| User-wise fetch + refetch on focus | `src/hooks/use-api-notifications.ts` |
| Header notification panel | `src/components/notifications/notification-panel.tsx` |
| Sidebar notification bell + list | `src/components/notifications/notification-bell.tsx`, `notification-list.tsx` |
| Favicon badge from API count | `src/components/notifications/notification-badge-sync.tsx` |
| Push + click handling | `public/sw.js` |

### 1.4 User Flow

1. **Listing**: User opens the notification panel or sidebar bell → client calls `GET /api/notifications` with auth cookie → server returns only that user’s notifications and unread count.
2. **Mark read**: User marks one or all as read → `POST .../read` or `.../read-all` with auth → server updates only that user’s notifications and invalidates unread cache.
3. **Web push**: User enables push in the UI → client gets VAPID key, subscribes via PushManager, sends subscription to `POST /api/push/subscribe` (with auth) → server stores subscription with current `userId`. When the server creates a notification (e.g. post approval), it calls `sendPushNotification(userId, payload)` → only that user’s active subscriptions receive the push → service worker shows the system notification; click opens the app at the payload URL.

### 1.5 Push Subscription and User Identity

- Subscriptions are stored per **endpoint** (unique per browser/device).
- On **subscribe**, the API **upserts** by endpoint and always sets **`userId` to the current authenticated user**. So if the same device is used by another user, the subscription is reassigned to the new user; push is only sent to the user who is currently logged in on that device.

### 1.6 Refresh and Badge

- **Refetch on visibility**: When the tab becomes visible again (e.g. after clicking a push notification), components using `useApiNotifications()` refetch so the list and count stay in sync.
- **Favicon badge**: `NotificationBadgeSync` (mounted in dashboard layout) uses the API unread count and updates the favicon/title badge so the tab reflects the same user-wise count.

---

## 2. Security

### 2.1 Authentication (Auth)

- **JWT**: Tokens are signed with a server-side secret (`getJwtSecret()`), include `id`, `email`, `role`, and expire (e.g. 7 days).
- **Password storage**: Passwords are hashed with **bcrypt** (cost 12) via `hashPassword`; login uses `comparePassword`. Plain passwords are never stored.
- **Session**: The app uses cookies (or headers) to send the token; `getCurrentUser(token)` validates the token and loads the user from the database; inactive users are treated as invalid.

### 2.2 Notification API Security

- **Authentication required**: All notification and push APIs use `requireAuth(request)`. Unauthenticated requests receive 401.
- **User isolation**:
  - **GET /api/notifications**: Returns only notifications where `userId === user.id` (from token).
  - **GET /api/notifications/unread-count**: Counts only that user’s unread notifications.
  - **POST /api/notifications/read-all**: Updates only notifications where `userId === user.id`.
  - **POST /api/notifications/[id]/read**: Loads the notification by `id`; if found, checks `notification.userId === user.id`. If not the owner, returns **403** and does not update. Only the owner can mark a notification as read.

### 2.3 Push Subscription Security

- **Subscribe**: `POST /api/push/subscribe` requires authentication. The subscription (endpoint + keys) is stored with the **current user’s id**. No one can register a subscription on behalf of another user.
- **Unsubscribe**: Typically uses the same auth; removal is scoped to the authenticated user’s subscriptions (e.g. by endpoint that belongs to them).
- **Sending push**: `sendPushNotification(userId, payload)` is server-only. It loads subscriptions with `where: { userId, isActive: true }`. Push is sent only to that user’s devices; no cross-user leakage.

### 2.4 VAPID and Environment

- **VAPID keys**: Web Push uses a public/private key pair. The **private key** (`VAPID_PRIVATE_KEY`) must stay on the server and never be exposed to the client. The **public key** is exposed via `GET /api/push/vapid-public-key` for subscription only; it does not allow sending or impersonation.
- **Secrets**: JWT secret, bcrypt, and VAPID private key must be in environment variables (e.g. `.env`) and must not be committed. Production should use a secure secret store.

### 2.5 Summary Table

| Area | Measure |
|------|--------|
| Notification list/count | Auth required; filtered by `userId` |
| Mark as read (one) | Auth + ownership check; 403 if not owner |
| Mark all as read | Auth; update many scoped by `userId` |
| Push subscribe | Auth; subscription tied to current `userId` |
| Push send | Server-only; send only to subscriptions for the given `userId` |
| Passwords | Bcrypt hashed; never stored in plain text |
| Sessions | JWT signed and validated; inactive users rejected |
| VAPID | Private key server-only; public key for subscription only |

---

## 3. Environment Variables (Reference)

For notifications and related security to work, ensure:

- **Auth**: `JWT_SECRET` (or equivalent used by `getJwtSecret()`).
- **Web push**:  
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` or `VAPID_PUBLIC_KEY`  
  - `VAPID_PRIVATE_KEY`  
  - Optional: `VAPID_SUBJECT` (e.g. `mailto:admin@example.com`).

Generate VAPID keys with: `npx web-push generate-vapid-keys`

---

*Last updated: February 2026*
