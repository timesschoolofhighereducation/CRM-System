'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit, Trash2, Copy, CheckCircle2, XCircle, Search, RefreshCw, FileSpreadsheet, FileText } from 'lucide-react'
import { EditPromotionCodeDialog } from './edit-promotion-code-dialog'
import { toast } from 'sonner'

interface PromotionCode {
  id: string
  code: string
  promoterName: string
  promoterAddress: string
  promoterPhone: string
  promoterIdNumber: string
  discountAmountLKR: number
  paymentAmountLKR: number
  isActive: boolean
  totalInquiries: number
  totalRegistrations: number
  totalPaidLKR: number
  createdAt: string
  createdBy?: {
    id: string
    name: string
    email: string
  }
}

export function PromotionCodesTable() {
  const [promotionCodes, setPromotionCodes] = useState<PromotionCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCode, setEditingCode] = useState<PromotionCode | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  useEffect(() => {
    fetchPromotionCodes()
  }, [])

  const fetchPromotionCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/promotion-codes')
      if (response.ok) {
        const data = await response.json()
        setPromotionCodes(data.promotionCodes || [])
      } else {
        toast.error('Failed to fetch promotion codes')
      }
    } catch (error) {
      console.error('Error fetching promotion codes:', error)
      toast.error('Failed to fetch promotion codes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion code?')) {
      return
    }

    try {
      const response = await fetch(`/api/promotion-codes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Promotion code deleted successfully')
        fetchPromotionCodes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete promotion code')
      }
    } catch (error) {
      console.error('Error deleting promotion code:', error)
      toast.error('Failed to delete promotion code')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Copied ${code} to clipboard`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(format)
      const response = await fetch(`/api/promotion-codes/export?format=${format}`)
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Export failed' }))
        toast.error(err.error || 'Failed to export promotion codes')
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = format === 'excel' ? 'xlsx' : 'pdf'
      a.download = `promotion-codes-report-${new Date().toISOString().split('T')[0]}.${ext}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
      toast.success(`Promotion codes report exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Error exporting promotion codes:', error)
      toast.error('Failed to export promotion codes')
    } finally {
      setExporting(null)
    }
  }

  const filteredCodes = promotionCodes.filter((code) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      code.code.toLowerCase().includes(query) ||
      code.promoterName.toLowerCase().includes(query) ||
      code.promoterPhone.includes(query) ||
      code.promoterIdNumber.includes(query)
    )
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading promotion codes...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <CardTitle>All Promotion Codes</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPromotionCodes}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                disabled={exporting !== null}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
              >
                <FileText className="h-4 w-4 mr-2" />
                {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by code, name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Promoter Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Discount (LKR)</TableHead>
                  <TableHead>Payment (LKR)</TableHead>
                  <TableHead>Inquiries</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Total Paid (LKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      {searchQuery ? 'No promotion codes found matching your search' : 'No promotion codes yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-semibold">
                        <div className="flex items-center space-x-2">
                          <span>{code.code}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopyCode(code.code)}
                            title="Copy code"
                          >
                            {copiedCode === code.code ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{code.promoterName}</TableCell>
                      <TableCell>{code.promoterPhone}</TableCell>
                      <TableCell className="font-medium">
                        {code.discountAmountLKR.toLocaleString('en-LK', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {code.paymentAmountLKR.toLocaleString('en-LK', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{code.totalInquiries}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {code.totalRegistrations}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-700">
                        {code.totalPaidLKR.toLocaleString('en-LK', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        {code.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCode(code)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(code.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingCode && (
        <EditPromotionCodeDialog
          promotionCode={editingCode}
          open={!!editingCode}
          onOpenChange={(open) => !open && setEditingCode(null)}
          onSuccess={fetchPromotionCodes}
        />
      )}
    </>
  )
}
