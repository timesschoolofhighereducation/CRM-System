'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield, Key, Plus, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UsersTable } from './users-table'
import { RolesTable } from './roles-table'
import { PermissionsTable } from './permissions-table'
import { NewUserDialog } from './new-user-dialog'
import { NewRoleDialog } from './new-role-dialog'
import { PermissionGate } from '@/hooks/use-permissions'
import { PromotionCodesTable } from '@/components/promotion-codes/promotion-codes-table'
import { NewPromotionCodeButton } from '@/components/promotion-codes/new-promotion-code-button'

export function UserManagementDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [showNewUserDialog, setShowNewUserDialog] = useState(false)
  const [showNewRoleDialog, setShowNewRoleDialog] = useState(false)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <PermissionGate permissions={['READ_USER']}>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </PermissionGate>
          <PermissionGate permissions={['READ_ROLE']}>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
          </PermissionGate>
          <PermissionGate permissions={['READ_ROLE']}>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          </PermissionGate>
          <PermissionGate permissions={['READ_ROLE']}>
            <TabsTrigger value="promotion-codes" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Promotion Codes
            </TabsTrigger>
          </PermissionGate>
        </TabsList>

        {/* Users Tab */}
        <PermissionGate permissions={['READ_USER']}>
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">User Management</h2>
                <p className="text-sm text-gray-600">Manage system users and their access</p>
              </div>
              <PermissionGate permissions={['CREATE_USER']}>
                <Button onClick={() => setShowNewUserDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </PermissionGate>
            </div>
            <UsersTable />
          </TabsContent>
        </PermissionGate>

        {/* Roles Tab */}
        <PermissionGate permissions={['READ_ROLE']}>
          <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Role Management</h2>
                <p className="text-sm text-gray-600">Create and manage user roles with specific permissions</p>
              </div>
              <PermissionGate permissions={['CREATE_ROLE']}>
                <Button onClick={() => setShowNewRoleDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Role
                </Button>
              </PermissionGate>
            </div>
            <RolesTable />
          </TabsContent>
        </PermissionGate>

        {/* Permissions Tab */}
        <PermissionGate permissions={['READ_ROLE']}>
          <TabsContent value="permissions" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Permission Management</h2>
                <p className="text-sm text-gray-600">View and manage system permissions</p>
              </div>
            </div>
            <PermissionsTable />
          </TabsContent>
        </PermissionGate>

        {/* Promotion Codes Tab */}
        <PermissionGate permissions={['READ_ROLE']}>
          <TabsContent value="promotion-codes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Promotion Codes</h2>
                <p className="text-sm text-gray-600">Manage promotion codes and track promoter payments</p>
              </div>
              <NewPromotionCodeButton />
            </div>
            <PromotionCodesTable />
          </TabsContent>
        </PermissionGate>
      </Tabs>

      {/* Dialogs */}
      <NewUserDialog 
        open={showNewUserDialog} 
        onOpenChange={setShowNewUserDialog} 
      />
      <NewRoleDialog 
        open={showNewRoleDialog} 
        onOpenChange={setShowNewRoleDialog} 
      />
    </div>
  )
}
