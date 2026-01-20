'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Loader2, MapPin, Globe, Monitor, RefreshCw, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([])
  const { user } = useAuth()

  const fetchRequestInquiries = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await fetch('/api/request-inquiries')
      if (response.ok) {
        const data = await response.json()
        // Data is already sorted by the API (non-converted first, then by creation date)
        setRequestInquiries(data)
        setFilteredInquiries(data)
        if (isRefresh) {
          toast.success('Data refreshed successfully')
        }
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
      const response = await fetch('/api/request-inquiries/programs')
      if (response.ok) {
        const data = await response.json()
        setAvailablePrograms(data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  useEffect(() => {
    fetchRequestInquiries()
    fetchPrograms()
  }, [])

  // Filter inquiries based on search term, program, and date range
  useEffect(() => {
    let filtered = requestInquiries

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inquiry =>
        inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.workPhone.includes(searchTerm)
      )
    }

    // Program filter
    if (selectedProgram !== 'all') {
      filtered = filtered.filter(inquiry =>
        inquiry.programs.some(vp => vp.program.programName === selectedProgram)
      )
    }

    // Date range filter
    if (dateRange?.from) {
      filtered = filtered.filter(inquiry => {
        const inquiryDate = new Date(inquiry.createdAt)
        const fromDate = new Date(dateRange.from!)
        fromDate.setHours(0, 0, 0, 0)
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999)
          return inquiryDate >= fromDate && inquiryDate <= toDate
        }
        return inquiryDate >= fromDate
      })
    }

    setFilteredInquiries(filtered)
  }, [searchTerm, selectedProgram, dateRange, requestInquiries])

  const handleRefresh = () => {
    fetchRequestInquiries(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedProgram('all')
    setDateRange(undefined)
  }

  const handleConvertToInquiry = async (requestInquiry: RequestInquiry) => {
    if (requestInquiry.isConverted) return
    
    // Use the convert API endpoint directly
    try {
      setConvertingIds(prev => new Set(prev).add(requestInquiry.id))
      
      const response = await fetch(`/api/request-inquiries/${requestInquiry.id}/convert`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to convert inquiry' }))
        toast.error(error.error || 'Failed to convert inquiry')
        return
      }

      const data = await response.json()
      const inquiryCount = data.inquiries?.length || 1
      
      toast.success(
        data.message || `Successfully created ${inquiryCount} inquir${inquiryCount === 1 ? 'y' : 'ies'} (one per program)`
      )
      
      if (data.failedPrograms && data.failedPrograms.length > 0) {
        toast.warning(`Failed to create inquiries for: ${data.failedPrograms.join(', ')}`)
      }

      // Refresh the list to get updated data
      await fetchRequestInquiries()
    } catch (error) {
      console.error('Error converting inquiry:', error)
      toast.error('Failed to convert inquiry')
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

  const hasActiveFilters = searchTerm || selectedProgram !== 'all' || dateRange?.from

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50/50 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Exhibition Registration Requests</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {filteredInquiries.length} of {requestInquiries.length} {requestInquiries.length === 1 ? 'visitor' : 'visitors'}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {availablePrograms.map((program) => (
                  <SelectItem key={program.id} value={program.programName}>
                    {program.programName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full sm:w-[280px] justify-start text-left font-normal ${
                    !dateRange?.from && 'text-muted-foreground'
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                        {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
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
                    {hasActiveFilters ? 'No exhibition registrations match your filters' : 'No exhibition registrations found'}
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
                        <div className="flex flex-col gap-1">
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
                                Converting...
                              </>
                            ) : isConverted ? (
                              'Converted'
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Inquiries
                              </>
                            )}
                          </Button>
                          {!isConverted && requestInquiry.programs.length > 1 && (
                            <span className="text-xs text-gray-500 text-center">
                              {requestInquiry.programs.length} programs
                            </span>
                          )}
                        </div>
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
