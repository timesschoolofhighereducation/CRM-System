import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// All permissions from Prisma Permission enum (single source of truth)
const DEFAULT_PERMISSIONS = [
  // User Management
  { name: 'CREATE_USER' as const, description: 'Create new users' },
  { name: 'READ_USER' as const, description: 'View user information' },
  { name: 'UPDATE_USER' as const, description: 'Update user information' },
  { name: 'DELETE_USER' as const, description: 'Delete users' },
  { name: 'ASSIGN_ROLE' as const, description: 'Assign roles to users' },
  { name: 'MANAGE_USER_ROLES' as const, description: 'Manage user role assignments' },
  // Role Management
  { name: 'CREATE_ROLE' as const, description: 'Create new roles' },
  { name: 'READ_ROLE' as const, description: 'View role information' },
  { name: 'UPDATE_ROLE' as const, description: 'Update role information' },
  { name: 'DELETE_ROLE' as const, description: 'Delete roles' },
  { name: 'MANAGE_ROLE_PERMISSIONS' as const, description: 'Manage role permissions' },
  // Seeker Management
  { name: 'CREATE_SEEKER' as const, description: 'Create new seekers' },
  { name: 'READ_SEEKER' as const, description: 'View seeker information' },
  { name: 'UPDATE_SEEKER' as const, description: 'Update seeker information' },
  { name: 'DELETE_SEEKER' as const, description: 'Delete seekers' },
  // Task Management
  { name: 'CREATE_TASK' as const, description: 'Create new tasks' },
  { name: 'READ_TASK' as const, description: 'View task information' },
  { name: 'UPDATE_TASK' as const, description: 'Update task information' },
  { name: 'DELETE_TASK' as const, description: 'Delete tasks' },
  { name: 'ASSIGN_TASK' as const, description: 'Assign tasks to users' },
  { name: 'MANAGE_TASK_CHECKLISTS' as const, description: 'Manage task checklists' },
  { name: 'MANAGE_TASK_ATTACHMENTS' as const, description: 'Manage task attachments' },
  { name: 'MANAGE_TASK_COMMENTS' as const, description: 'Manage task comments' },
  { name: 'MANAGE_TASK_TIME_ENTRIES' as const, description: 'Manage task time entries' },
  { name: 'CREATE_SUBTASKS' as const, description: 'Create subtasks' },
  // Program Management
  { name: 'CREATE_PROGRAM' as const, description: 'Create new programs' },
  { name: 'READ_PROGRAM' as const, description: 'View program information' },
  { name: 'UPDATE_PROGRAM' as const, description: 'Update program information' },
  { name: 'DELETE_PROGRAM' as const, description: 'Delete programs' },
  // Campaign Management
  { name: 'CREATE_CAMPAIGN' as const, description: 'Create new campaigns' },
  { name: 'READ_CAMPAIGN' as const, description: 'View campaign information' },
  { name: 'UPDATE_CAMPAIGN' as const, description: 'Update campaign information' },
  { name: 'DELETE_CAMPAIGN' as const, description: 'Delete campaigns' },
  { name: 'MANAGE_CAMPAIGN_ANALYTICS' as const, description: 'Manage campaign analytics' },
  // Inquiry Management
  { name: 'CREATE_INQUIRY' as const, description: 'Create new inquiries' },
  { name: 'READ_INQUIRY' as const, description: 'View inquiry information' },
  { name: 'UPDATE_INQUIRY' as const, description: 'Update inquiry information' },
  { name: 'DELETE_INQUIRY' as const, description: 'Delete inquiries' },
  { name: 'MANAGE_INQUIRY_INTERACTIONS' as const, description: 'Manage inquiry interactions' },
  // Reports & Analytics
  { name: 'READ_REPORTS' as const, description: 'View reports' },
  { name: 'EXPORT_REPORTS' as const, description: 'Export reports' },
  { name: 'VIEW_ANALYTICS' as const, description: 'View analytics data' },
  // System Settings
  { name: 'READ_SETTINGS' as const, description: 'View system settings' },
  { name: 'UPDATE_SETTINGS' as const, description: 'Update system settings' },
  { name: 'MANAGE_SYSTEM_CONFIG' as const, description: 'Manage system configuration' },
  // Project Management
  { name: 'CREATE_PROJECT' as const, description: 'Create new projects' },
  { name: 'READ_PROJECT' as const, description: 'View project information' },
  { name: 'UPDATE_PROJECT' as const, description: 'Update project information' },
  { name: 'DELETE_PROJECT' as const, description: 'Delete projects' },
  { name: 'MANAGE_PROJECT_MEMBERS' as const, description: 'Manage project members' },
  // Deal Management
  { name: 'CREATE_DEAL' as const, description: 'Create new deals' },
  { name: 'READ_DEAL' as const, description: 'View deal information' },
  { name: 'UPDATE_DEAL' as const, description: 'Update deal information' },
  { name: 'DELETE_DEAL' as const, description: 'Delete deals' },
  { name: 'MANAGE_DEAL_ACTIVITIES' as const, description: 'Manage deal activities' },
  // Client Management
  { name: 'CREATE_CLIENT' as const, description: 'Create new clients' },
  { name: 'READ_CLIENT' as const, description: 'View client information' },
  { name: 'UPDATE_CLIENT' as const, description: 'Update client information' },
  { name: 'DELETE_CLIENT' as const, description: 'Delete clients' },
  // Notebook Management
  { name: 'CREATE_NOTEBOOK' as const, description: 'Create new notebooks' },
  { name: 'READ_NOTEBOOK' as const, description: 'View notebook information' },
  { name: 'UPDATE_NOTEBOOK' as const, description: 'Update notebook information' },
  { name: 'DELETE_NOTEBOOK' as const, description: 'Delete notebooks' },
  { name: 'CREATE_NOTE' as const, description: 'Create new notes' },
  { name: 'READ_NOTE' as const, description: 'View note information' },
  { name: 'UPDATE_NOTE' as const, description: 'Update note information' },
  { name: 'DELETE_NOTE' as const, description: 'Delete notes' },
  // Special Permissions
  { name: 'DELETE_ADMINISTRATOR' as const, description: 'Delete administrator users' },
  { name: 'MANAGE_ALL_USERS' as const, description: 'Manage all users in the system' },
  { name: 'SYSTEM_ADMINISTRATION' as const, description: 'Full system administration access' }
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMINISTRATOR: [
    'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'MANAGE_USER_ROLES',
    'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'MANAGE_TASK_CHECKLISTS', 'MANAGE_TASK_ATTACHMENTS', 'MANAGE_TASK_COMMENTS', 'MANAGE_TASK_TIME_ENTRIES', 'CREATE_SUBTASKS',
    'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM',
    'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN', 'MANAGE_CAMPAIGN_ANALYTICS',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
    'READ_SETTINGS', 'UPDATE_SETTINGS', 'MANAGE_SYSTEM_CONFIG',
    'CREATE_PROJECT', 'READ_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'MANAGE_PROJECT_MEMBERS',
    'CREATE_DEAL', 'READ_DEAL', 'UPDATE_DEAL', 'DELETE_DEAL', 'MANAGE_DEAL_ACTIVITIES',
    'CREATE_CLIENT', 'READ_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT',
    'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
    'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
    'DELETE_ADMINISTRATOR', 'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
  ],
  ADMIN: [
    'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'MANAGE_USER_ROLES',
    'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'MANAGE_TASK_CHECKLISTS', 'MANAGE_TASK_ATTACHMENTS', 'MANAGE_TASK_COMMENTS', 'MANAGE_TASK_TIME_ENTRIES', 'CREATE_SUBTASKS',
    'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM',
    'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN', 'MANAGE_CAMPAIGN_ANALYTICS',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
    'READ_SETTINGS', 'UPDATE_SETTINGS', 'MANAGE_SYSTEM_CONFIG',
    'CREATE_PROJECT', 'READ_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'MANAGE_PROJECT_MEMBERS',
    'CREATE_DEAL', 'READ_DEAL', 'UPDATE_DEAL', 'DELETE_DEAL', 'MANAGE_DEAL_ACTIVITIES',
    'CREATE_CLIENT', 'READ_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT',
    'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
    'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
    'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
  ],
  DEVELOPER: [
    'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'MANAGE_USER_ROLES',
    'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'MANAGE_TASK_CHECKLISTS', 'MANAGE_TASK_ATTACHMENTS', 'MANAGE_TASK_COMMENTS', 'MANAGE_TASK_TIME_ENTRIES', 'CREATE_SUBTASKS',
    'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM',
    'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN', 'MANAGE_CAMPAIGN_ANALYTICS',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
    'READ_SETTINGS', 'UPDATE_SETTINGS', 'MANAGE_SYSTEM_CONFIG',
    'CREATE_PROJECT', 'READ_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'MANAGE_PROJECT_MEMBERS',
    'CREATE_DEAL', 'READ_DEAL', 'UPDATE_DEAL', 'DELETE_DEAL', 'MANAGE_DEAL_ACTIVITIES',
    'CREATE_CLIENT', 'READ_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT',
    'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
    'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
    'DELETE_ADMINISTRATOR', 'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
  ],
  COORDINATOR: [
    'READ_USER', 'UPDATE_USER',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'READ_PROGRAM', 'READ_CAMPAIGN',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'VIEW_ANALYTICS'
  ],
  VIEWER: [
    'READ_USER', 'READ_SEEKER', 'READ_TASK', 'READ_PROGRAM', 'READ_CAMPAIGN',
    'READ_INQUIRY', 'READ_REPORTS', 'VIEW_ANALYTICS'
  ],
  SYSTEM: [
    'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'MANAGE_USER_ROLES',
    'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'MANAGE_TASK_CHECKLISTS', 'MANAGE_TASK_ATTACHMENTS', 'MANAGE_TASK_COMMENTS', 'MANAGE_TASK_TIME_ENTRIES', 'CREATE_SUBTASKS',
    'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM',
    'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN', 'MANAGE_CAMPAIGN_ANALYTICS',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
    'READ_SETTINGS', 'UPDATE_SETTINGS', 'MANAGE_SYSTEM_CONFIG',
    'CREATE_PROJECT', 'READ_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'MANAGE_PROJECT_MEMBERS',
    'CREATE_DEAL', 'READ_DEAL', 'UPDATE_DEAL', 'DELETE_DEAL', 'MANAGE_DEAL_ACTIVITIES',
    'CREATE_CLIENT', 'READ_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT',
    'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
    'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
    'DELETE_ADMINISTRATOR', 'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
  ]
}

async function main() {
  console.log('🌱 Seeding roles and permissions...')

  try {
    // Create permissions
    console.log('Creating permissions...')
    for (const permission of DEFAULT_PERMISSIONS) {
      await prisma.permissionModel.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      })
    }

    // Create roles
    console.log('Creating roles...')
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {
          description: getRoleDescription(roleName),
          isActive: true
        },
        create: {
          name: roleName,
          description: getRoleDescription(roleName),
          isActive: true
        }
      })

      // Clear existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      })

      // Add permissions to role
      for (const permissionName of permissions) {
        const permission = await prisma.permissionModel.findUnique({
          where: { name: permissionName as any }
        })

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          })
        }
      }

      console.log(`✅ Created role: ${roleName} with ${permissions.length} permissions`)
    }

    console.log('🎉 Roles and permissions seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

function getRoleDescription(roleName: string): string {
  const descriptions: Record<string, string> = {
    ADMINISTRATOR: 'Full system access with ability to delete administrators',
    ADMIN: 'Full system access but cannot delete administrators',
    DEVELOPER: 'Full system access for development purposes',
    COORDINATOR: 'Limited access to inquiries, tasks, and basic user management',
    VIEWER: 'Read-only access to system data',
    SYSTEM: 'System/technical role with full access'
  }
  return descriptions[roleName] || ''
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
