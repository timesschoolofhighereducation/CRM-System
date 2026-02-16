# Security Assessment Report

**Application:** CRM / Next.js application  
**Assessment type:** Code review vs. international security standards  
**Standards referenced:** OWASP Top 10, NIST SP 800-63 (auth), ISO/IEC 27001, CWE/SANS Top 25

---

## Executive summary

This report lists security issues found in the codebase and maps them to common standards. **Critical** and **high** issues should be fixed before production or as soon as possible.

---

## 1. Critical issues

### 1.1 Hardcoded / fallback JWT secret (A02:2021 – Cryptographic Failures; CWE-798)

**Location:**  
- `src/middleware.ts` (line 5)  
- `src/lib/auth.ts` (line 7)

**Code:**
```ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
```

**Issue:** If `JWT_SECRET` is not set (e.g. misconfiguration, new environment), the app uses a fixed fallback. Attackers can forge valid JWTs and impersonate any user.

**Standards:**
- **OWASP:** A02:2021 Cryptographic Failures – sensitive data must not rely on default/weak secrets.
- **NIST SP 800-63B:** Cryptographic keys must be randomly generated and protected; no default or shared secrets.

**Recommendation:**  
- Remove the fallback. Fail startup if `JWT_SECRET` is missing or too short (e.g. require ≥32 bytes).  
- Use a secrets manager in production and never commit secrets.

---

### 1.2 JWT stored in activity logs (A02:2021 – Cryptographic Failures; CWE-532)

**Location:**  
- `src/app/api/auth/login/route.ts` (line 29)  
- `src/lib/activity-logger.ts` – `sessionId` stored in `UserActivityLog`  
- `src/app/api/auth/logout/route.ts` – token passed to `logLogout` as `sessionId`

**Code (login):**
```ts
await logLogin(user.id, request, user.token)  // user.token is the full JWT
```

**Issue:** The full JWT is passed as `sessionId` and persisted in `UserActivityLog.sessionId`. Anyone with DB or log access can steal tokens and hijack sessions.

**Standards:**
- **OWASP A02:** Secrets must not be logged or stored unnecessarily.  
- **PCI DSS / ISO 27001:** Sensitive authentication data must not be stored after authorization (except when required and protected).

**Recommendation:**  
- Do **not** pass the JWT to `logLogin` / `logLogout` as `sessionId`.  
- Use an opaque session id (e.g. UUID) if you need to correlate logs, or leave `sessionId` empty and log only `userId`, IP, and timestamp.

---

### 1.3 Login without password for users with no password (A07:2021 – Identification and Authentication Failures; CWE-287)

**Location:** `src/lib/auth.ts` (lines 184–191)

**Code:**
```ts
// For development, we'll skip password check if no password is set
if (user.password) {
  const isValidPassword = await comparePassword(password, user.password)
  if (!isValidPassword) return null
}
// If no user.password, login succeeds with any password
```

**Issue:** Any user with `password == null` or empty can log in with any password (or none). If such accounts exist in production (e.g. migrated users, SSO leftovers), this is a critical authentication bypass.

**Standards:**
- **OWASP A07:** Authentication must always verify credentials; no “dev-only” bypass in shared code paths.  
- **NIST SP 800-63B:** Memorized secrets (passwords) must be verified for each authentication.

**Recommendation:**  
- Require a non-empty password for password-based login.  
- If you need “no password” for special cases, guard that path by environment (e.g. `NODE_ENV === 'development'`) and/or a separate mechanism (e.g. magic link only), and never use it in production.

---

## 2. High issues

### 2.1 Promotion code validation endpoint unauthenticated (A01:2021 – Broken Access Control; CWE-200)

**Location:** `src/app/api/promotion-codes/validate/[code]/route.ts`

**Issue:** The endpoint has no `requireAuth()` (or equivalent). Anyone can:
- Enumerate promotion codes (e.g. by guessing or iterating).
- Read business data (e.g. discount amounts, payment amounts, total inquiries/registrations per code).

**Standards:**
- **OWASP A01:** Access control must be enforced on every request; limit data exposure to the minimum needed.  
- **OWASP A04 (Insecure Design):** Public APIs should only expose data necessary for the intended use (e.g. “is this code valid?” vs. full stats).

**Recommendation:**  
- If validation must be public (e.g. checkout page), return only what is needed (e.g. valid/invalid, discount amount for that code).  
- Do not return internal stats (e.g. total inquiries/registrations) to unauthenticated callers.  
- Consider rate limiting and/or CAPTCHA to prevent code enumeration.

---

### 2.2 Middleware does not enforce authentication (A01:2021 – Broken Access Control)

**Location:** `src/middleware.ts` (lines 41–44, 73–74)

**Code:**
```ts
if (!token) {
  return NextResponse.next()  // Allows unauthenticated access to non-public pages
}
// ...
// Invalid token - continue (let API routes handle auth errors)
return NextResponse.next()
```

**Issue:** Missing or invalid token still results in `NextResponse.next()`. So:
- Unauthenticated users can load protected pages (UI only; APIs may still reject).  
- Invalid tokens are not rejected at the edge; every API route must correctly enforce auth.  
- Risk of inconsistent enforcement and information leakage from pages that assume “only authenticated users reach here.”

**Standards:**
- **OWASP A01:** Deny by default; enforce authentication at the boundary.  
- **NIST / defense in depth:** Use a single, consistent enforcement point where possible (e.g. middleware) and do not rely solely on each route “remembering” to check auth.

**Recommendation:**  
- For protected routes, redirect to sign-in when there is no valid token (e.g. redirect to `/sign-in` with `returnTo`).  
- When token is present but invalid, clear cookies and redirect to sign-in (or return 401 for API routes).  
- Keep API routes checking auth as a second layer; do not rely only on middleware for API.

---

### 2.3 Session-activity cookie not HttpOnly (A05:2021 – Security Misconfiguration; CWE-1004)

**Location:**  
- `src/app/api/auth/login/route.ts` (line 53)  
- `src/app/api/auth/me/route.ts` (line 50)  
- `src/app/api/auth/session-activity/route.ts` (line 34)  
- `src/middleware.ts` (line 61)

**Code:**
```ts
response.cookies.set('session-activity', sessionExpiry.toString(), {
  httpOnly: false,  // Client needs to read this
  ...
})
```

**Issue:** Comment says the client needs to read it for inactivity. That is valid for UX, but a non-HttpOnly cookie is readable by any script on the page (including XSS). An attacker could extend the session by rewriting this cookie.

**Standards:**
- **OWASP A05:** Use HttpOnly for cookies that affect security (e.g. session lifetime).  
- **NIST:** Minimize sensitive data exposed to client scripts.

**Recommendation:**  
- Prefer keeping session extension server-side only: e.g. client calls “heartbeat” (e.g. `POST /api/auth/session-activity`), server updates expiry and sets an HttpOnly cookie or stores in server-side session.  
- If you must keep a client-readable value, use a separate cookie (e.g. `session-activity-display`) that is not used for server-side decisions, and make the authoritative session-activity cookie HttpOnly.

---

### 2.4 File upload: MIME type and size only partially validated (A04:2021 – Insecure Design; A03:2021 – Injection)

**Location:** `src/app/api/upload/route.ts`

**Issues:**
- **MIME:** Validation uses `file.type` (client-controlled). Attackers can send a malicious file with `Content-Type: image/png`.  
- **Size:** Comment says “File size validation is handled on the frontend.” Server does not enforce a limit, enabling DoS (large uploads) and possible resource exhaustion.  
- **Filename:** Extension taken from `file.name`; if not sanitized elsewhere, path traversal or overwrite risks (current code uses `randomUUID()` for the stored name, which mitigates but should be explicit policy).

**Standards:**
- **OWASP A03/A04:** Never trust client input for security decisions; validate type (e.g. magic bytes) and size on the server.  
- **CWE-434:** Unrestricted file upload – validate type and size server-side.

**Recommendation:**  
- Validate file type server-side (e.g. magic bytes / signature for allowed image types).  
- Enforce a maximum file size (e.g. 5–10 MB) and reject larger uploads.  
- Keep using a server-generated name (e.g. UUID) and avoid using client `file.name` in storage paths.

---

### 2.5 Sensitive data and stack traces in API error responses (A04:2021 – Insecure Design; CWE-209)

**Locations (examples):**
- `src/app/api/upload/route.ts` (lines 84–90, 104–108): S3 and local error messages and “suggestion” in JSON.  
- `src/app/api/promotion-codes/validate/[code]/route.ts` (line 66): `error.message` in 500 response.  
- `src/app/api/promotion-codes/[id]/route.ts`: `error.message` in 500 responses.  
- `src/app/api/users/route.ts` (line 107): `error.message` in 500.  
- `src/app/api/users/[id]/route.ts` (lines 133, 191): `error.message` in 500.

**Issue:** Returning internal error messages or stack traces to the client can reveal:
- Database or schema details.  
- File paths, environment, or third-party service names.  
- Hints for further attacks.

**Standards:**
- **OWASP A04:** Generic error messages to clients; detailed errors only in server logs.  
- **CWE-209:** Do not expose internal error details to untrusted parties.

**Recommendation:**  
- In production, return a generic message (e.g. “An error occurred”) and status 500.  
- Log full error (and stack) server-side only.  
- Do not include `error.message`, `details`, or `suggestion` with internal information in API responses.

---

### 2.6 Stored XSS via `dangerouslySetInnerHTML` (A03:2021 – Injection; CWE-79)

**Locations:**
- `src/components/inquiries/inquiry-view-dialog.tsx` (line 546): `program.description`  
- `src/components/inquiries/program-details-quick-view-dialog.tsx` (lines 185, 267): program descriptions  
- `src/components/program-descriptions/program-description-dashboard.tsx` (lines 143, 178): description + `innerHTML` with `imageUrl`  
- `src/components/collaboration/comment-system.tsx` (line 415)  
- `src/app/email-campaign/page.tsx` (line 862)

**Issue:** User- or admin-editable content (e.g. program descriptions, comments, campaign content) is rendered with `dangerouslySetInnerHTML` (or `innerHTML`) without sanitization. Stored HTML/JS can execute in other users’ browsers (XSS).

**Standards:**
- **OWASP A03:** All output must be encoded or sanitized; avoid raw HTML from untrusted input.  
- **CWE-79:** Use a safe API or a vetted sanitizer (allowlist) for HTML.

**Recommendation:**  
- Sanitize all HTML before rendering (e.g. DOMPurify with a strict config) or use a safe rich-text renderer.  
- For `imageUrl` in `innerHTML`, avoid building HTML from user-controlled URLs; use a safe attribute (e.g. `img.src` with URL validation) or render via React instead of raw HTML.

---

## 3. Medium issues

### 3.1 No security headers (A05:2021 – Security Misconfiguration)

**Issue:** No evidence of:
- `Content-Security-Policy`  
- `X-Frame-Options` (e.g. `DENY` or `SAMEORIGIN`)  
- `X-Content-Type-Options: nosniff`  
- `Strict-Transport-Security` (HSTS) in production

**Standards:**
- **OWASP A05:** Apply secure headers.  
- **CIS / Mozilla:** CSP, X-Frame-Options, HSTS, and X-Content-Type-Options are recommended.

**Recommendation:**  
- Add security headers in Next.js (e.g. `next.config.js` headers or middleware).  
- Use a strict CSP and relax only where necessary; set HSTS with `includeSubDomains` and `preload` in production over HTTPS.

---

### 3.2 No CSRF protection for state-changing operations (A01:2021 – Broken Access Control; CWE-352)

**Issue:** No CSRF tokens or SameSite/CSRF mitigations found for POST/PUT/DELETE.  
- Cookies use `sameSite: 'lax'`, which reduces but does not eliminate CSRF for same-site or top-level navigations.  
- No double-submit cookie or custom header checks.

**Standards:**
- **OWASP A01:** Protect state-changing requests against CSRF.  
- **NIST:** Use CSRF tokens or SameSite plus other defenses for authenticated requests.

**Recommendation:**  
- For cookie-based auth, consider SameSite=Strict for the auth cookie where compatible with your flows.  
- Add CSRF tokens for sensitive state-changing operations, or require a custom header (e.g. `X-Requested-With`) and strict SameSite + origin checks.

---

### 3.3 No rate limiting on login (A07:2021 – Identification and Authentication Failures; CWE-307)

**Issue:** Login endpoint has no rate limiting. Enables brute-force and credential stuffing.

**Standards:**
- **OWASP A07:** Implement rate limiting and lockout for login.  
- **NIST SP 800-63B:** Limit failed authentication attempts.

**Recommendation:**  
- Add rate limiting (e.g. per IP and per identifier) on `/api/auth/login`.  
- After N failed attempts, temporarily lock the account or require CAPTCHA/delay.  
- Log and monitor failed logins.

---

### 3.4 Levels API uses `requireRole('ADMIN')` without request (A01:2021 – Broken Access Control)

**Location:** `src/app/api/levels/route.ts` and `src/app/api/levels/[id]/route.ts`

**Code:**
```ts
const _user = await requireRole('ADMIN')  // request not passed
```

**Issue:** `requireAuth`/`requireRole` without request fall back to `nextCookies()`. In API route context this can be brittle or inconsistent (e.g. depending on how Next passes cookies). Could lead to auth being skipped or failing in an unpredictable way.

**Standards:**
- **OWASP A01:** Consistently pass request context into auth so the same mechanism is used everywhere.

**Recommendation:**  
- Pass `request` into `requireRole`: `requireRole('ADMIN', request)` in all API handlers.

---

### 3.5 Promotion codes: any authenticated user can access any code (IDOR risk) (A01:2021 – Broken Access Control)

**Location:** `src/app/api/promotion-codes/[id]/route.ts`

**Issue:** GET/PUT/DELETE use `requireAuth(request)` but no check that the promotion code belongs to the user or that the user has the right role. Any logged-in user can read, update, or delete any promotion code by ID.

**Standards:**
- **OWASP A01:** Enforce authorization per resource (ownership or role).  
- **CWE-639:** Do not allow access to objects based on identifier alone without an ownership/role check.

**Recommendation:**  
- If promotion codes are tenant/creator-scoped: allow access only if the code’s `createdById` (or similar) matches the current user, or if the user has an admin role.  
- Apply the same rule for PUT and DELETE.

---

## 4. Summary vs. standards

| Standard / list        | Relevant finding |
|------------------------|------------------|
| **OWASP Top 10**       | A01 (access control), A02 (crypto/logging), A03 (XSS), A04 (design/errors), A05 (headers/config), A07 (auth/rate limiting). |
| **NIST SP 800-63 (auth)** | Strong secret for JWT; no default passwords; rate limiting and failed-attempt handling; no long-term secrets in logs. |
| **CWE Top 25**         | CWE-79 (XSS), CWE-200 (info disclosure), CWE-287 (auth bypass), CWE-352 (CSRF), CWE-434 (file upload), CWE-532 (info in logs), CWE-798 (hardcoded secret). |
| **ISO/IEC 27001**      | A.9.4.1 (access control), A.9.4.2 (secure login), A.12.3.1 (documented procedures and logging without sensitive data). |

---

## 5. Recommended priority order

1. **Immediate:** Remove JWT secret fallback; stop storing JWT in activity logs; fix login so users without a password cannot log in with any password.  
2. **Short term:** Harden promotion code validate endpoint (auth or minimal data + rate limit); enforce auth in middleware for protected routes; add server-side file type/size validation; sanitize HTML for `dangerouslySetInnerHTML`; stop leaking internal errors in API responses.  
3. **Next:** Security headers; CSRF protection; login rate limiting; fix `requireRole('ADMIN', request)` in levels API; add authorization checks for promotion codes by owner/role.

---

*This report is based on a static code review. A full assessment would include dynamic testing, dependency scanning, and infrastructure review.*
