'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, MapPin, Globe, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { NewInquiryDialog } from './new-inquiry-dialog'

interface Program {
  id: number
  programName: string
  category: string | null
  isActive: boolean
}

interface VisitorProgram {
  id: string
  program: Program
}

interface VisitorMetadata {
  id: string
  ipAddress: string | null
  country: string | null
  city: string | null
  region: string | null
  timezone: string | null
  browser: string | null
  device: string | null
  submissionDate: string | null
  submissionTime: string | null
}

interface RequestInquiry {
  id: string
  name: string
  workPhone: string
  isConverted: boolean
  convertedAt: string | null
  createdAt: string
  programs: VisitorProgram[]
  metadata: VisitorMetadata | null
}

export function RequestInquiriesTable() {
  const [requestInquiries, setRequestInquiries] = useState<RequestInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<RequestInquiry | null>(null)
  const { user } = useAuth()

  const fetchRequestInquiries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/request-inquiries')
      if (response.ok) {
        const data = await response.json()
        // Data is already sorted by the API (non-converted first, then by creation date)
        setRequestInquiries(data)
      } else {
        toast.error('Failed to fetch request inquiries')
      }
    } catch (error) {
      console.error('Error fetching request inquiries:', error)
      toast.error('Failed to fetch request inquiries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequestInquiries()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRequestInquiries, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleConvertToInquiry = (requestInquiry: RequestInquiry) => {
    if (requestInquiry.isConverted) return
    
    // Open the dialog with pre-filled data
    setSelectedVisitor(requestInquiry)
    setIsDialogOpen(true)
  }

  const handleInquiryCreated = async (visitorId: string) => {
    try {
      // Mark the visitor as converted in the database
      const response = await fetch(`/api/request-inquiries/${visitorId}/mark-converted`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to mark visitor as converted' }))
        console.error('Error marking visitor as converted:', error)
        // Don't show error to user since inquiry was already created successfully
      }

      // Refresh the list to get updated data from database
      await fetchRequestInquiries()
    } catch (error) {
      console.error('Error marking visitor as converted:', error)
      // Don't show error to user since inquiry was already created successfully
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setSelectedVisitor(null)
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-600">Loading request inquiries...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50/50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Exhibition Registration Requests</CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">
            {requestInquiries.length} {requestInquiries.length === 1 ? 'visitor' : 'visitors'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Programs</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device Info</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No exhibition registrations found
                  </TableCell>
                </TableRow>
              ) : (
                requestInquiries.map((requestInquiry) => {
                  const isConverting = convertingIds.has(requestInquiry.id)
                  const isConverted = requestInquiry.isConverted
                  const programs = requestInquiry.programs?.map(vp => vp.program.programName).join(', ') || 'None'
                  const location = requestInquiry.metadata 
                    ? `${requestInquiry.metadata.city || ''}${requestInquiry.metadata.city && requestInquiry.metadata.country ? ', ' : ''}${requestInquiry.metadata.country || ''}`.trim() || '-'
                    : '-'
                  const deviceInfo = requestInquiry.metadata
                    ? `${requestInquiry.metadata.browser || 'Unknown'}${requestInquiry.metadata.device ? ` • ${requestInquiry.metadata.device}` : ''}`
                    : '-'
                  
                  return (
                    <TableRow
                      key={requestInquiry.id}
                      className={
                        isConverted
                          ? 'bg-red-50 hover:bg-red-100 transition-colors'
                          : 'hover:bg-gray-50 transition-colors'
                      }
                    >
                      <TableCell className="font-medium">{requestInquiry.name}</TableCell>
                      <TableCell>{requestInquiry.workPhone}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={programs}>
                          {programs}
                        </div>
                      </TableCell>
                      <TableCell>
                        {requestInquiry.metadata ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{location}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {deviceInfo}
                      </TableCell>
                      <TableCell>
                        {new Date(requestInquiry.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(requestInquiry.createdAt).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isConverted ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            Converted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleConvertToInquiry(requestInquiry)}
                          disabled={isConverted || isConverting}
                          className={
                            isConverted
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : ''
                          }
                        >
                          {isConverting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : isConverted ? (
                            'Converted'
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Inquiry
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <NewInquiryDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        initialData={selectedVisitor ? {
          id: selectedVisitor.id,
          name: selectedVisitor.name,
          workPhone: selectedVisitor.workPhone,
          programs: selectedVisitor.programs,
          metadata: selectedVisitor.metadata,
        } : null}
        onInquiryCreated={handleInquiryCreated}
      />
    </Card>
  )
}
