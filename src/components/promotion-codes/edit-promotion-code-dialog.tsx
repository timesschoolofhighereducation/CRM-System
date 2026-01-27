'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const promotionCodeSchema = z.object({
  promoterName: z.string().min(1, 'Promoter name is required'),
  promoterAddress: z.string().min(1, 'Address is required'),
  promoterPhone: z.string().min(1, 'Phone number is required'),
  promoterIdNumber: z.string().min(1, 'ID number is required'),
  discountAmountLKR: z.string().min(1, 'Discount amount is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    'Discount amount must be a valid number'
  ),
  paymentAmountLKR: z.string().min(1, 'Payment amount is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    'Payment amount must be a valid number'
  ),
  isActive: z.boolean(),
})

type PromotionCodeFormData = z.infer<typeof promotionCodeSchema>

interface PromotionCode {
  id: string
  code: string
  promoterName: string
  promoterAddress: string
  promoterPhone: string
  promoterIdNumber: string
  discountAmountLKR: number
  paymentAmountLKR: number
  isActive?: boolean
}

interface EditPromotionCodeDialogProps {
  promotionCode: PromotionCode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditPromotionCodeDialog({
  promotionCode,
  open,
  onOpenChange,
  onSuccess,
}: EditPromotionCodeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<PromotionCodeFormData>({
    resolver: zodResolver(promotionCodeSchema),
    defaultValues: {
      promoterName: promotionCode.promoterName,
      promoterAddress: promotionCode.promoterAddress,
      promoterPhone: promotionCode.promoterPhone,
      promoterIdNumber: promotionCode.promoterIdNumber,
      discountAmountLKR: promotionCode.discountAmountLKR.toString(),
      paymentAmountLKR: promotionCode.paymentAmountLKR.toString(),
      isActive: promotionCode.isActive ?? true,
    } as PromotionCodeFormData,
  })

  useEffect(() => {
    if (open && promotionCode) {
      form.reset({
        promoterName: promotionCode.promoterName,
        promoterAddress: promotionCode.promoterAddress,
        promoterPhone: promotionCode.promoterPhone,
        promoterIdNumber: promotionCode.promoterIdNumber,
        discountAmountLKR: promotionCode.discountAmountLKR.toString(),
        paymentAmountLKR: promotionCode.paymentAmountLKR.toString(),
        isActive: promotionCode.isActive ?? true,
      })
    }
  }, [open, promotionCode, form])

  const onSubmit = async (data: PromotionCodeFormData) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/promotion-codes/${promotionCode.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          discountAmountLKR: parseFloat(data.discountAmountLKR),
          paymentAmountLKR: parseFloat(data.paymentAmountLKR),
        }),
      })

      if (response.ok) {
        toast.success(`Promotion code ${promotionCode.code} updated successfully!`)
        onSuccess?.()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update promotion code')
      }
    } catch (error) {
      console.error('Error updating promotion code:', error)
      toast.error('Failed to update promotion code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Promotion Code: {promotionCode.code}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Code:</strong> {promotionCode.code} (cannot be changed)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promoterName">Promoter Name *</Label>
              <Input
                id="promoterName"
                {...form.register('promoterName')}
                placeholder="Enter promoter name"
              />
              {form.formState.errors.promoterName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.promoterName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="promoterPhone">Phone Number *</Label>
              <Input
                id="promoterPhone"
                {...form.register('promoterPhone')}
                placeholder="Enter phone number"
              />
              {form.formState.errors.promoterPhone && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.promoterPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoterAddress">Address *</Label>
            <Input
              id="promoterAddress"
              {...form.register('promoterAddress')}
              placeholder="Enter full address"
            />
            {form.formState.errors.promoterAddress && (
              <p className="text-sm text-red-600">
                {form.formState.errors.promoterAddress.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoterIdNumber">ID Number *</Label>
            <Input
              id="promoterIdNumber"
              {...form.register('promoterIdNumber')}
              placeholder="Enter ID number"
            />
            {form.formState.errors.promoterIdNumber && (
              <p className="text-sm text-red-600">
                {form.formState.errors.promoterIdNumber.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountAmountLKR">Discount Amount (LKR) *</Label>
              <Input
                id="discountAmountLKR"
                type="number"
                step="0.01"
                {...form.register('discountAmountLKR')}
                placeholder="0.00"
              />
              {form.formState.errors.discountAmountLKR && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.discountAmountLKR.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmountLKR">Payment Amount (LKR) *</Label>
              <Input
                id="paymentAmountLKR"
                type="number"
                step="0.01"
                {...form.register('paymentAmountLKR')}
                placeholder="0.00"
              />
              {form.formState.errors.paymentAmountLKR && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.paymentAmountLKR.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Promotion Code
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
