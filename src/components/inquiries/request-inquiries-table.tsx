'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Plus, Loader2, MapPin, Globe, Monitor, RefreshCw, Search, Filter, X, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { NewInquiryDialog } from './new-inquiry-dialog'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

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

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showFilters, setShowFilters] = useState(false)

  const fetchRequestInquiries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/request-inquiries')
      if (response.ok) {
        const data = await response.json()
        // Data is already sorted by the API (non-converted first, then by creation date)
        setRequestInquiries(data)
        toast.success('Request inquiries refreshed')
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
    // Removed auto-refresh - users will use manual refresh button instead
  }, [])

  const handleConvertToInquiry = (requestInquiry: RequestInquiry) => {
    if (requestInquiry.isConverted) {
      toast.info('This visitor has already been converted to inquiries')
      return
    }
    
    // Check if visitor has programs
    if (!requestInquiry.programs || requestInquiry.programs.length === 0) {
      toast.error('This visitor has no programs selected')
      return
    }
    
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

  // Get unique programs for filter dropdown
  const uniquePrograms = useMemo(() => {
    const programsSet = new Set<string>()
    requestInquiries.forEach(inquiry => {
      inquiry.programs?.forEach(vp => {
        programsSet.add(vp.program.programName)
      })
    })
    return Array.from(programsSet).sort()
  }, [requestInquiries])

  // Filter inquiries based on search, program, and date range
  const filteredInquiries = useMemo(() => {
    let filtered = [...requestInquiries]

    // Search filter - universal search across all fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(inquiry => {
        const programs = inquiry.programs?.map(vp => vp.program.programName).join(' ').toLowerCase() || ''
        const location = inquiry.metadata 
          ? `${inquiry.metadata.city || ''} ${inquiry.metadata.country || ''}`.toLowerCase()
          : ''
        const deviceInfo = inquiry.metadata
          ? `${inquiry.metadata.browser || ''} ${inquiry.metadata.device || ''}`.toLowerCase()
          : ''
        
        return (
          inquiry.name.toLowerCase().includes(query) ||
          inquiry.workPhone.includes(query) ||
          programs.includes(query) ||
          location.includes(query) ||
          deviceInfo.includes(query)
        )
      })
    }

    // Program filter
    if (selectedProgram && selectedProgram !== 'all') {
      filtered = filtered.filter(inquiry => 
        inquiry.programs?.some(vp => vp.program.programName === selectedProgram)
      )
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(inquiry => {
        const inquiryDate = new Date(inquiry.createdAt)
        return inquiryDate >= dateRange.from!
      })
    }
    if (dateRange.to) {
      filtered = filtered.filter(inquiry => {
        const inquiryDate = new Date(inquiry.createdAt)
        // Set to end of day for 'to' date
        const toDate = new Date(dateRange.to!)
        toDate.setHours(23, 59, 59, 999)
        return inquiryDate <= toDate
      })
    }

    return filtered
  }, [requestInquiries, searchQuery, selectedProgram, dateRange])

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedProgram('all')
    setDateRange({})
  }

  const hasActiveFilters = searchQuery || selectedProgram !== 'all' || dateRange.from || dateRange.to

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Exhibition Registration Requests</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {filteredInquiries.length} {filteredInquiries.length === 1 ? 'visitor' : 'visitors'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRequestInquiries}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Universal Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, program, location, device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  •
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Program Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Program</label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {uniquePrograms.map(program => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date Range</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          )}
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
              {filteredInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {hasActiveFilters 
                      ? 'No exhibition registrations match your filters' 
                      : 'No exhibition registrations found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.map((requestInquiry) => {
                  const isConverting = convertingIds.has(requestInquiry.id)
                  const isConverted = requestInquiry.isConverted
                  const programsList = requestInquiry.programs?.map(vp => vp.program.programName) || []
                  const programsCount = programsList.length
                  const programs = programsList.join(', ') || 'None'
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
                        <div className="flex items-center gap-2">
                          <div className="truncate" title={programs}>
                            {programs}
                          </div>
                          {programsCount > 1 && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {programsCount} programs
                            </Badge>
                          )}
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
                          title={programsCount > 1 ? `Will create ${programsCount} separate inquiries (one for each program)` : 'Create inquiry from this registration'}
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
                              {programsCount > 1 ? `Create ${programsCount} Inquiries` : 'Create Inquiry'}
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
