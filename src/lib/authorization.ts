import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions'
import { hasAnyPermission, hasAllPermissions } from '@/lib/permissions'

export class ForbiddenError extends Error {
  constructor(message: string = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ForbiddenError)
    }
  }
}

export type RequirePermissionOptions = {
  /** If true, allow when user has any of the given permissions. If false, require all. Default false. */
  any?: boolean
  /** If true, users with admin role (ADMIN, ADMINISTRATOR, DEVELOPER) bypass the permission check. Default true. */
  adminBypass?: boolean
}

/**
 * Get effective permission names for a user:
 * - From DB: user -> userRoles -> role -> rolePermissions -> permission.name
 * - If user has no assigned roles, fall back to DEFAULT_ROLE_PERMISSIONS[user.role] (legacy)
 */
export async function getEffectivePermissionsForUser(userId: string): Promise<string[]> {
  const { permissions } = await getEffectivePermissionsAndRolesForUser(userId)
  return permissions
}

export type EffectivePermissionsAndRoles = {
  permissions: string[]
  roles: { id: string; name: string }[]
}

/**
 * Get effective permissions and assigned role summaries for a user (single query).
 */
export async function getEffectivePermissionsAndRolesForUser(
  userId: string
): Promise<EffectivePermissionsAndRoles> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    return { permissions: [], roles: [] }
  }

  const roles = (user.userRoles ?? []).map((ur) => ({ id: ur.role.id, name: ur.role.name }))
  const fromRoles = (user.userRoles ?? []).flatMap((ur) =>
    ur.role.permissions.map((rp) => rp.permission.name)
  )
  const distinctFromDb = [...new Set(fromRoles)]

  if (distinctFromDb.length > 0) {
    return { permissions: distinctFromDb, roles }
  }

  // Legacy fallback: no DB role assignments — use User.role enum mapping
  const legacy = DEFAULT_ROLE_PERMISSIONS[user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS]
  return {
    permissions: legacy ? [...legacy] : [],
    roles
  }
}

/**
 * Require the current user to have the given permission(s).
 * - permission: single permission string or array of permission strings
 * - options.any: if true, require at least one; if false, require all (default false)
 * - options.adminBypass: if true (default), admin roles bypass the check
 * @returns the authenticated user
 * @throws ForbiddenError if permission check fails, AuthenticationError if not authenticated
 */
export async function requirePermission(
  permission: string | string[],
  request?: Parameters<typeof requireAuth>[0],
  options: RequirePermissionOptions = {}
): Promise<{ id: string; name: string; email: string; role: string; isActive: boolean }> {
  const { any: requireAny = false, adminBypass = true } = options
  const user = await requireAuth(request)

  if (adminBypass && (user.role === 'ADMIN' || user.role === 'ADMINISTRATOR' || user.role === 'DEVELOPER')) {
    return user
  }

  const permissions = await getEffectivePermissionsForUser(user.id)
  const required = Array.isArray(permission) ? permission : [permission]

  const allowed = requireAny
    ? hasAnyPermission(permissions, required)
    : hasAllPermissions(permissions, required)

  if (!allowed) {
    throw new ForbiddenError(
      requireAny
        ? `Access denied. One of these permissions is required: ${required.join(', ')}`
        : `Access denied. Required permission(s): ${required.join(', ')}`
    )
  }

  return user
}
