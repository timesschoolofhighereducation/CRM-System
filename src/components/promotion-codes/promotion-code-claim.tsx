'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, Gift } from 'lucide-react'
import { toast } from 'sonner'

interface PromotionCodeClaimProps {
  value?: string
  onChange?: (code: string | null, discount: number | null) => void
  disabled?: boolean
}

export function PromotionCodeClaim({ value, onChange, disabled }: PromotionCodeClaimProps) {
  const [code, setCode] = useState(value || '')
  const [validating, setValidating] = useState(false)
  const [validCode, setValidCode] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Please enter a promotion code')
      return
    }

    try {
      setValidating(true)
      setError(null)
      const response = await fetch(`/api/promotion-codes/validate/${code.trim().toUpperCase()}`)

      if (response.ok) {
        const data = await response.json()
        setValidCode(data)
        onChange?.(data.id, data.discountAmountLKR)
        toast.success(`Promotion code ${data.code} applied! Discount: LKR ${data.discountAmountLKR.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Invalid promotion code')
        setValidCode(null)
        onChange?.(null, null)
        toast.error(errorData.error || 'Invalid promotion code')
      }
    } catch (error) {
      console.error('Error validating promotion code:', error)
      setError('Failed to validate promotion code')
      setValidCode(null)
      onChange?.(null, null)
      toast.error('Failed to validate promotion code')
    } finally {
      setValidating(false)
    }
  }

  const handleClear = () => {
    setCode('')
    setValidCode(null)
    setError(null)
    onChange?.(null, null)
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="promotionCode">Promotion Code</Label>
      <div className="flex items-start space-x-2">
        <div className="flex-1">
          <Input
            id="promotionCode"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              if (validCode) {
                setValidCode(null)
                setError(null)
                onChange?.(null, null)
              }
            }}
            placeholder="Enter promotion code (e.g., A0001)"
            disabled={disabled || validating}
            className="font-mono"
          />
        </div>
        {validCode ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={disabled}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Clear
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleValidate}
            disabled={disabled || validating || !code.trim()}
          >
            {validating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Gift className="h-4 w-4 mr-2" />
            )}
            Claim
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {validCode && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  Promotion Code: <span className="font-mono">{validCode.code}</span>
                </p>
                <p className="text-sm text-green-700">
                  Discount: <span className="font-semibold">LKR {validCode.discountAmountLKR.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Applied
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
