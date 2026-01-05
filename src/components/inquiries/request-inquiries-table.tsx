'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

interface RequestInquiry {
  id: string
  fullName: string
  phone: string
  email?: string
  whatsapp: boolean
  whatsappNumber?: string
  city?: string
  ageBand?: string
  guardianPhone?: string
  marketingSource?: string
  preferredContactTime?: string
  preferredStatus?: number
  description?: string
  consent: boolean
  isConverted: boolean
  convertedAt?: string
  convertedById?: string
  createdAt: string
  updatedAt: string
}

export function RequestInquiriesTable() {
  const [requestInquiries, setRequestInquiries] = useState<RequestInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  const fetchRequestInquiries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/request-inquiries')
      if (response.ok) {
        const data = await response.json()
        // Sort: non-converted first, then by creation date (newest first)
        const sorted = data.sort((a: RequestInquiry, b: RequestInquiry) => {
          if (a.isConverted !== b.isConverted) {
            return a.isConverted ? 1 : -1
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setRequestInquiries(sorted)
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

  const handleConvertToInquiry = async (requestInquiry: RequestInquiry) => {
    if (convertingIds.has(requestInquiry.id)) return

    try {
      setConvertingIds(prev => new Set(prev).add(requestInquiry.id))
      
      const response = await fetch(`/api/request-inquiries/${requestInquiry.id}/convert`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to convert request inquiry' }))
        toast.error(error.error || 'Failed to convert request inquiry')
        return
      }

      const result = await response.json()
      
      // Update the request inquiry in the list
      setRequestInquiries(prev => {
        const updated = prev.map(ri => 
          ri.id === requestInquiry.id 
            ? { ...ri, isConverted: true, convertedAt: new Date().toISOString(), convertedById: user?.id }
            : ri
        )
        // Move converted item to bottom
        const nonConverted = updated.filter(ri => !ri.isConverted)
        const converted = updated.filter(ri => ri.isConverted)
        return [...nonConverted, ...converted]
      })

      toast.success(`Inquiry created successfully for ${requestInquiry.fullName}`)
    } catch (error) {
      console.error('Error converting request inquiry:', error)
      toast.error('Failed to convert request inquiry')
    } finally {
      setConvertingIds(prev => {
        const next = new Set(prev)
        next.delete(requestInquiry.id)
        return next
      })
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
          <CardTitle className="text-lg font-semibold text-gray-900">Request Inquiries</CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">
            {requestInquiries.length} {requestInquiries.length === 1 ? 'request' : 'requests'}
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
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Marketing Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No request inquiries found
                  </TableCell>
                </TableRow>
              ) : (
                requestInquiries.map((requestInquiry) => {
                  const isConverting = convertingIds.has(requestInquiry.id)
                  const isConverted = requestInquiry.isConverted
                  
                  return (
                    <TableRow
                      key={requestInquiry.id}
                      className={
                        isConverted
                          ? 'bg-red-50 hover:bg-red-100 transition-colors'
                          : 'hover:bg-gray-50 transition-colors'
                      }
                    >
                      <TableCell className="font-medium">{requestInquiry.fullName}</TableCell>
                      <TableCell>{requestInquiry.phone}</TableCell>
                      <TableCell>{requestInquiry.email || '-'}</TableCell>
                      <TableCell>{requestInquiry.city || '-'}</TableCell>
                      <TableCell>{requestInquiry.marketingSource || '-'}</TableCell>
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
                        {new Date(requestInquiry.createdAt).toLocaleDateString()}
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
    </Card>
  )
}

