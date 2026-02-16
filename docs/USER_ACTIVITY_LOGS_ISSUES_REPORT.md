# User Activity Logs - Issues & Recommendations Report

**Date:** February 16, 2026  
**Reviewed By:** Senior Software Developer  
**Scope:** User Activity Logging System Analysis

---

## Executive Summary

The User Activity Logs system is functional but has several **critical performance, security, and maintainability issues** that need immediate attention. The system currently logs user authentication activities, profile changes, and inquiry operations, but lacks proper indexing, has potential performance bottlenecks, and missing safeguards for production environments.

---

## 🔴 CRITICAL ISSUES

### 1. Missing Database Indexes (HIGH PRIORITY)

**Location:** `prisma/schema.prisma` - UserActivityLog model (lines 500-517)

**Issue:**  
The `UserActivityLog` table has **NO indexes** defined, which will cause severe performance degradation as logs accumulate.

**Current Code:**
```prisma
model UserActivityLog {
  id            String       @id @default(cuid())
  userId        String
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  activityType  ActivityType
  timestamp     DateTime     @default(now())
  // ... other fields
  
  @@map("user_activity_logs")
  // ❌ NO INDEXES DEFINED
}
```

**Impact:**
- Slow queries when fetching user-specific logs
- Pagination performance degrades exponentially with data growth
- Filtering by activityType or date range becomes unbearably slow
- Admin dashboard will timeout with large datasets (10K+ logs)

**Evidence from Code:**
- API query at `src/app/api/user-activity/route.ts:70` uses:
  - `where: { userId }` - unindexed
  - `orderBy: { timestamp: 'desc' }` - unindexed
  - Multiple WHERE conditions with activityType, timestamp range

**Recommended Fix:**
```prisma
model UserActivityLog {
  // ... existing fields ...
  
  @@index([userId, timestamp(sort: Desc)])
  @@index([activityType, timestamp(sort: Desc)])
  @@index([isSuccessful, timestamp(sort: Desc)])
  @@index([timestamp(sort: Desc)])
  @@map("user_activity_logs")
}
```

**Business Impact:** Database queries will slow down login/logout operations and admin reports as usage grows.

---

### 2. Synchronous Blocking Geolocation API Call (HIGH PRIORITY)

**Location:** `src/lib/activity-logger.ts:41`

**Issue:**  
The `getLocationFromIP` function is **awaited synchronously**, blocking the entire login flow with an external API call.

**Current Code:**
```typescript
// Line 41 in activity-logger.ts
const locationData = await getLocationFromIP(ipAddress)  // ❌ BLOCKS LOGIN
```

**Impact:**
- Every login/logout waits for geolocation API response (200-500ms latency)
- If ipapi.co is slow or down, ALL logins are affected
- Free tier limit (1000 req/day) can be exhausted quickly
- No fallback mechanism = failed logins if API is down

**Evidence:**
- `src/lib/geolocation.ts:34` calls external API `https://ipapi.co/${ipAddress}/json/`
- No timeout configured
- No retry logic
- No circuit breaker pattern

**Recommended Fix:**
```typescript
// Make geolocation async and non-blocking
const activityLog = await prisma.userActivityLog.create({
  data: {
    userId,
    activityType,
    ipAddress,
    userAgent,
    location: null, // Set initially to null
    // ... other fields
  }
})

// Update location asynchronously (fire and forget)
getLocationFromIP(ipAddress)
  .then(locationData => {
    if (locationData && activityLog) {
      prisma.userActivityLog.update({
        where: { id: activityLog.id },
        data: { location: locationData as any }
      }).catch(err => console.error('Failed to update location:', err))
    }
  })
  .catch(err => console.error('Geolocation failed:', err))

return activityLog
```

**Business Impact:** Login performance is unnecessarily slow; system is vulnerable to third-party API failures.

---

### 3. No Log Retention/Cleanup Strategy (MEDIUM-HIGH PRIORITY)

**Location:** System-wide - No cleanup mechanism exists

**Issue:**  
Activity logs accumulate **indefinitely** with no archival or deletion strategy.

**Impact:**
- Database grows unbounded
- Backup/restore times increase
- Query performance degrades over time
- Storage costs increase linearly
- Compliance issues (GDPR requires data retention limits)

**Example Growth:**
- 100 users × 10 logins/day = 1,000 logs/day
- 365 days = 365,000 logs/year
- 5 years = 1,825,000 logs (without any cleanup)

**Recommended Solution:**

1. **Add a System Setting:**
```typescript
// Default: keep logs for 90 days
ACTIVITY_LOG_RETENTION_DAYS = "90"
```

2. **Create Cleanup Job:**
```typescript
// src/lib/activity-log-cleanup.ts
export async function cleanupOldActivityLogs() {
  const retentionDays = await getSystemSetting('ACTIVITY_LOG_RETENTION_DAYS', '90')
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(retentionDays))
  
  const deleted = await prisma.userActivityLog.deleteMany({
    where: {
      timestamp: { lt: cutoffDate }
    }
  })
  
  console.log(`Cleaned up ${deleted.count} old activity logs`)
}
```

3. **Schedule with cron or Next.js API route:**
```typescript
// Run daily at 2 AM
// src/app/api/cron/cleanup-logs/route.ts (protected by API key)
```

**Business Impact:** Database will eventually run out of space; compliance violations possible.

---

## 🟡 MODERATE ISSUES

### 4. Incomplete ActivityType Enum (MEDIUM PRIORITY)

**Location:** `prisma/schema.prisma:488-498`

**Issue:**  
The `ActivityType` enum is **missing** activity types that are actively being used in the codebase.

**Current Enum:**
```prisma
enum ActivityType {
  LOGIN
  LOGOUT
  SESSION_TIMEOUT
  PASSWORD_CHANGE
  PROFILE_UPDATE
  SYSTEM_ACCESS
  CREATE_INQUIRY
  UPDATE_INQUIRY
  DELETE_INQUIRY
}
```

**Problem:**  
The enum **exists correctly** in the schema, BUT the activity logs dashboard filter at `src/components/admin/activity-logs-dashboard.tsx:278-283` only shows a subset:

```typescript
<SelectContent>
  <SelectItem value="all">All activities</SelectItem>
  <SelectItem value="LOGIN">Login</SelectItem>
  <SelectItem value="LOGOUT">Logout</SelectItem>
  <SelectItem value="SESSION_TIMEOUT">Session Timeout</SelectItem>
  <SelectItem value="PASSWORD_CHANGE">Password Change</SelectItem>
  <SelectItem value="PROFILE_UPDATE">Profile Update</SelectItem>
  {/* ❌ Missing: CREATE_INQUIRY, UPDATE_INQUIRY, DELETE_INQUIRY, SYSTEM_ACCESS */}
</SelectContent>
```

**Recommended Fix:**
Update the dashboard component to include all activity types:
```typescript
<SelectContent>
  <SelectItem value="all">All activities</SelectItem>
  <SelectItem value="LOGIN">Login</SelectItem>
  <SelectItem value="LOGOUT">Logout</SelectItem>
  <SelectItem value="SESSION_TIMEOUT">Session Timeout</SelectItem>
  <SelectItem value="PASSWORD_CHANGE">Password Change</SelectItem>
  <SelectItem value="PROFILE_UPDATE">Profile Update</SelectItem>
  <SelectItem value="SYSTEM_ACCESS">System Access</SelectItem>
  <SelectItem value="CREATE_INQUIRY">Create Inquiry</SelectItem>
  <SelectItem value="UPDATE_INQUIRY">Update Inquiry</SelectItem>
  <SelectItem value="DELETE_INQUIRY">Delete Inquiry</SelectItem>
</SelectContent>
```

---

### 5. Failed Login Logging Creates Confusing System User (MEDIUM PRIORITY)

**Location:** `src/lib/activity-logger.ts:93-141`

**Issue:**  
Failed login attempts for non-existent users create a fake "System" user, polluting the audit trail.

**Current Code:**
```typescript
// Lines 124-140
if (!systemUserId) {
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@failed-login.local' }
  })
  
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        name: 'System (Failed Login)',
        email: 'system@failed-login.local',
        role: 'SYSTEM',
        isActive: false
      }
    })
  }
  systemUserId = systemUser.id
}
```

**Problems:**
1. Creates a fake user in the users table
2. All failed login attempts from different non-existent emails are grouped under one user
3. Makes it hard to track brute-force attacks against specific emails
4. The `SYSTEM` role may not exist in the UserRole enum

**Recommended Solution:**

**Option A: Allow NULL userId for failed logins**
```prisma
model UserActivityLog {
  id            String       @id @default(cuid())
  userId        String?      // ✅ Make nullable
  user          User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... rest of fields
}
```

**Option B: Store attempted email in metadata**
```typescript
// For failed logins, use metadata to track attempted email
const activityLog = await prisma.userActivityLog.create({
  data: {
    userId: systemUserId,  // Still use system user
    activityType: 'LOGIN',
    // ... other fields ...
    metadata: {
      attemptedEmail: email,
      failureTime: new Date().toISOString(),
      isFailedLogin: true,
      attackVector: 'unknown_user'  // ✅ Better tracking
    }
  }
})
```

**Business Impact:** Security audit trails are unclear; difficult to identify attack patterns.

---

### 6. No Rate Limiting for Geolocation API (MEDIUM PRIORITY)

**Location:** `src/lib/geolocation.ts:20-56`

**Issue:**  
The geolocation API (ipapi.co) has a **free tier limit of 1,000 requests/day**, with no rate limiting or quota management.

**Impact:**
- Quota can be exhausted in a few hours with moderate traffic
- No fallback when quota exceeded
- Subsequent logins fail to get location data silently

**Recommended Fix:**

1. **Add caching:**
```typescript
// Cache IP locations for 24 hours
const locationCache = new Map<string, { data: LocationData, expiry: number }>()

export async function getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
  // Check cache first
  const cached = locationCache.get(ipAddress)
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }
  
  // ... fetch from API ...
  
  // Cache for 24 hours
  locationCache.set(ipAddress, {
    data: locationData,
    expiry: Date.now() + (24 * 60 * 60 * 1000)
  })
  
  return locationData
}
```

2. **Add request counter and fallback:**
```typescript
let dailyRequestCount = 0
let lastResetDate = new Date().toDateString()

export async function getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
  // Reset counter daily
  const today = new Date().toDateString()
  if (today !== lastResetDate) {
    dailyRequestCount = 0
    lastResetDate = today
  }
  
  // Check quota
  if (dailyRequestCount >= 950) { // Leave buffer
    console.warn('Geolocation API quota nearly exhausted')
    return null
  }
  
  dailyRequestCount++
  // ... fetch from API ...
}
```

**Business Impact:** Geolocation data randomly stops working mid-day.

---

### 7. Missing Session ID Tracking (LOW-MEDIUM PRIORITY)

**Location:** `src/app/api/auth/login/route.ts:39`

**Issue:**  
The activity logger accepts `sessionId` parameter, but it's never passed during login/logout.

**Current Code:**
```typescript
// Line 39 in login/route.ts
await logLogin(user.id, request)  // ❌ No sessionId passed
```

**Function Signature:**
```typescript
// activity-logger.ts
export async function logLogin(userId: string, request: NextRequest, sessionId?: string)
```

**Impact:**
- Cannot correlate multiple activities from the same session
- Difficult to track session hijacking
- Cannot identify suspicious concurrent sessions

**Recommended Fix:**
```typescript
// In login/route.ts
const sessionId = generateSessionId() // or use JWT token ID
await logLogin(user.id, request, sessionId)

// Store sessionId in JWT or cookie for logout tracking
response.cookies.set('session-id', sessionId, { ... })
```

**Business Impact:** Limited forensic capabilities for security investigations.

---

## 🔵 MINOR ISSUES / IMPROVEMENTS

### 8. Basic User Agent Parsing (LOW PRIORITY)

**Location:** `src/lib/geolocation.ts:58-100`

**Issue:**  
User agent parsing is very basic and doesn't recognize many modern browsers/devices.

**Current Code:**
```typescript
if (userAgent.includes('Chrome')) browser = 'Chrome'
else if (userAgent.includes('Firefox')) browser = 'Firefox'
// ...
```

**Problems:**
- Edge appears as "Chrome" (Edge is Chromium-based)
- Mobile Chrome appears as just "Chrome"
- No version information
- Doesn't detect Arc, Brave, Vivaldi, etc.

**Recommended Solution:**
Use a proper user agent parsing library:
```bash
npm install ua-parser-js
```

```typescript
import UAParser from 'ua-parser-js'

export function parseUserAgent(userAgent: string): DeviceInfo {
  const parser = new UAParser(userAgent)
  const result = parser.getResult()
  
  return {
    browser: `${result.browser.name} ${result.browser.version}`,
    os: `${result.os.name} ${result.os.version}`,
    device: result.device.type || 'Desktop',
    platform: `${result.os.name} ${result.device.type || 'Desktop'}`
  }
}
```

---

### 9. No Timeout for Geolocation API (LOW PRIORITY)

**Location:** `src/lib/geolocation.ts:34`

**Issue:**  
The fetch call has no timeout, could hang indefinitely.

**Recommended Fix:**
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

try {
  const response = await fetch(
    `https://ipapi.co/${ipAddress}/json/`,
    { signal: controller.signal }
  )
  clearTimeout(timeoutId)
  // ... rest of code
} catch (error) {
  clearTimeout(timeoutId)
  if (error.name === 'AbortError') {
    console.warn('Geolocation API timeout')
  }
  return null
}
```

---

### 10. Export Limit Too High (LOW PRIORITY)

**Location:** `src/app/api/user-activity/export/route.ts:86`

**Issue:**  
Export is hardcoded to 10,000 records with no pagination.

```typescript
take: 10000  // ❌ Could cause memory issues
```

**Recommended Fix:**
- Implement streaming export for large datasets
- Or warn users when export exceeds reasonable size
- Or implement chunked export with multiple files

---

## 📊 Performance Metrics Estimation

### Current Performance (Estimated):

| Scenario | Records | Query Time (No Index) | Query Time (With Index) |
|----------|---------|----------------------|------------------------|
| User logs | 1,000 | 50ms | 5ms |
| User logs | 10,000 | 500ms | 10ms |
| User logs | 100,000 | 5000ms+ | 15ms |
| User logs | 1,000,000 | 50000ms+ (timeout) | 25ms |

### Database Growth:

| Users | Logins/Day | Records/Year | Storage/Year (est) |
|-------|------------|--------------|-------------------|
| 50 | 500 | 182,500 | ~50 MB |
| 100 | 1,000 | 365,000 | ~100 MB |
| 500 | 5,000 | 1,825,000 | ~500 MB |
| 1,000 | 10,000 | 3,650,000 | ~1 GB |

---

## 🎯 Recommended Action Plan

### Phase 1: IMMEDIATE (This Week)
1. ✅ Add database indexes (5 minutes + migration)
2. ✅ Make geolocation async/non-blocking (30 minutes)
3. ✅ Add IP location caching (20 minutes)

### Phase 2: SHORT TERM (This Sprint)
4. ✅ Implement log retention/cleanup (2 hours)
5. ✅ Update activity type filters in dashboard (15 minutes)
6. ✅ Add geolocation API timeout (15 minutes)

### Phase 3: MEDIUM TERM (Next Sprint)
7. ✅ Fix failed login user handling (1 hour)
8. ✅ Implement session ID tracking (1 hour)
9. ✅ Add proper user agent parsing library (30 minutes)

### Phase 4: FUTURE IMPROVEMENTS
10. Add real-time activity monitoring
11. Implement anomaly detection (suspicious logins)
12. Add geolocation visualization (maps)
13. Implement export streaming for large datasets

---

## 🔒 Security Considerations

1. **PII Data:** Activity logs contain IP addresses and location data (PII under GDPR)
   - Ensure proper data retention policies
   - Implement user data deletion (right to erasure)
   - Consider anonymizing old logs

2. **Access Control:** Currently only admins can view logs ✅ (correct)

3. **Audit Trail Integrity:** 
   - Consider making logs immutable (no DELETE, only INSERT)
   - Add log tampering detection (checksums)

---

## 📝 Summary

| Priority | Issue Count | Est. Fix Time |
|----------|-------------|---------------|
| 🔴 Critical | 3 | 4 hours |
| 🟡 Moderate | 5 | 6 hours |
| 🔵 Minor | 2 | 2 hours |
| **TOTAL** | **10** | **~12 hours** |

**Overall Assessment:**  
The system is **functional but not production-ready** for scale. The most critical issues (missing indexes and blocking geolocation) should be addressed immediately before performance becomes a user-facing problem.

---

**Next Steps:**
1. Review this report with the team
2. Prioritize fixes based on current traffic and growth projections
3. Create tickets for each issue
4. Implement fixes in priority order
5. Add monitoring/alerting for log system health

---

*Report generated by Senior Software Developer - February 16, 2026*
