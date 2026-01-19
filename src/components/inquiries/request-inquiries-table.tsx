'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Loader2, MapPin, Globe, Monitor, RefreshCw, Search, CalendarIcon, Filter, X } from 'lucide-react'
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
  const [filteredInquiries, setFilteredInquiries] = useState<RequestInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<RequestInquiry | null>(null)
  const { user } = useAuth()
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showFilters, setShowFilters] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])

  const fetchRequestInquiries = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
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
      setRefreshing(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns?limit=100')
      if (response.ok) {
        const data = await response.json()
        const campaignsData = data.campaigns || (Array.isArray(data) ? data : [])
        setCampaigns(campaignsData)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  useEffect(() => {
    fetchRequestInquiries()
    fetchPrograms()
    fetchCampaigns()
    // Removed auto-refresh - now using manual refresh button only
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

  // Filter logic
  useEffect(() => {
    let filtered = [...requestInquiries]

    // Universal search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(inquiry =>
        inquiry.name.toLowerCase().includes(query) ||
        inquiry.workPhone.includes(query) ||
        inquiry.programs?.some(vp => vp.program.programName.toLowerCase().includes(query)) ||
        inquiry.metadata?.city?.toLowerCase().includes(query) ||
        inquiry.metadata?.country?.toLowerCase().includes(query) ||
        inquiry.metadata?.browser?.toLowerCase().includes(query) ||
        inquiry.metadata?.device?.toLowerCase().includes(query)
      )
    }

    // Program filter
    if (selectedPrograms.length > 0) {
      filtered = filtered.filter(inquiry =>
        inquiry.programs?.some(vp => selectedPrograms.includes(vp.program.id.toString()))
      )
    }

    // Campaign filter (if we add campaign tracking later)
    // For now, campaigns might not be directly tracked in request inquiries
    
    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(inquiry => {
        const inquiryDate = new Date(inquiry.createdAt)
        if (dateRange.from && inquiryDate < dateRange.from) return false
        if (dateRange.to) {
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999) // Include the entire end date
          if (inquiryDate > toDate) return false
        }
        return true
      })
    }

    setFilteredInquiries(filtered)
  }, [requestInquiries, searchQuery, selectedPrograms, selectedCampaigns, dateRange])

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedPrograms([])
    setSelectedCampaigns([])
    setDateRange({})
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (searchQuery) count++
    if (selectedPrograms.length > 0) count++
    if (selectedCampaigns.length > 0) count++
    if (dateRange.from || dateRange.to) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  // Get unique programs from inquiries for filter dropdown
  const uniquePrograms = useMemo(() => {
    const programMap = new Map<number, Program>()
    requestInquiries.forEach(inquiry => {
      inquiry.programs?.forEach(vp => {
        if (!programMap.has(vp.program.id)) {
          programMap.set(vp.program.id, vp.program)
        }
      })
    })
    return Array.from(programMap.values())
  }, [requestInquiries])

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Exhibition Registration Requests</CardTitle>
            <Badge variant="secondary" className="text-xs font-medium">
              {filteredInquiries.length} {filteredInquiries.length === 1 ? 'visitor' : 'visitors'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRequestInquiries(true)}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Search and Filter Section */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, phone, program, location, device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 h-10 shadow-sm border-gray-300 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 border-blue-200">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {/* Program Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Programs</label>
              <Select
                value={selectedPrograms.length > 0 ? selectedPrograms[0] : ''}
                onValueChange={(value) => {
                  if (value) {
                    if (!selectedPrograms.includes(value)) {
                      setSelectedPrograms([...selectedPrograms, value])
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {uniquePrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.programName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPrograms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPrograms.map((programId) => {
                    const program = uniquePrograms.find(p => p.id.toString() === programId)
                    return (
                      <Badge key={programId} variant="secondary" className="flex items-center space-x-1">
                        <span>{program?.programName || programId}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setSelectedPrograms(selectedPrograms.filter(id => id !== programId))}
                        />
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                      ) : (
                        format(dateRange.from, 'MMM dd, yyyy')
                      )
                    ) : (
                      'Select date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Search: "{searchQuery}"</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSearchQuery('')}
                />
              </Badge>
            )}
            {selectedPrograms.map((programId) => {
              const program = uniquePrograms.find(p => p.id.toString() === programId)
              return (
                <Badge key={programId} variant="secondary" className="flex items-center space-x-1">
                  <span>Program: {program?.programName || programId}</span>
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedPrograms(selectedPrograms.filter(id => id !== programId))}
                  />
                </Badge>
              )
            })}
            {(dateRange.from || dateRange.to) && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>
                  Date: {dateRange.from ? format(dateRange.from, 'MMM dd') : 'Start'}
                  {' - '}
                  {dateRange.to ? format(dateRange.to, 'MMM dd') : 'End'}
                </span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setDateRange({})}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

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
                    {requestInquiries.length === 0 
                      ? 'No exhibition registrations found' 
                      : 'No results match your filters'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.map((requestInquiry) => {
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
