'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Upload,
  X,
  Plus,
  ImageIcon,
  Zap,
  Loader2,
  FileText,
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
} from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { cn } from '@/lib/utils'

interface Program {
  id: string
  name: string
  campus: string
}

interface Campaign {
  id: string
  name: string
  type: string
}

interface User {
  id: string
  name: string
  email: string
}

interface NewPostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated?: () => void
}

export function NewPostDialog({ open, onOpenChange, onPostCreated }: NewPostDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isCompressingImage, setIsCompressingImage] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    caption: '',
    imageUrl: '',
    budget: '',
    startDate: '',
    endDate: '',
    programId: '',
    campaignId: '',
    approvers: [] as string[],
  })

  useEffect(() => {
    if (open) {
      fetchPrograms()
      fetchCampaigns()
      fetchUsers()
    }
  }, [open])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) setPrograms(await response.json())
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) setUsers(await response.json())
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const processAndUploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    let processedFile = file
    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {
      setIsCompressingImage(true)
      toast.info('Large image detected — compressing...')
      try {
        processedFile = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8,
        })
        const ratio = (((file.size - processedFile.size) / file.size) * 100).toFixed(1)
        toast.success(`Image compressed — size reduced by ${ratio}%`)
      } catch {
        toast.error('Image compression failed')
        setIsCompressingImage(false)
        return
      } finally {
        setIsCompressingImage(false)
      }
    }

    setImagePreview(URL.createObjectURL(processedFile))
    setIsUploadingImage(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', processedFile)
      formDataUpload.append('folder', 'posts')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
        toast.success('Image uploaded successfully')
      } else {
        toast.error('Failed to upload image')
        setImagePreview(null)
        setFormData(prev => ({ ...prev, imageUrl: '' }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      setImagePreview(null)
      setFormData(prev => ({ ...prev, imageUrl: '' }))
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processAndUploadImage(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processAndUploadImage(file)
    },
    [processAndUploadImage]
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }))
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleApproverChange = (index: number, userId: string) => {
    setFormData(prev => {
      const newApprovers = [...prev.approvers]
      newApprovers[index] = userId
      return { ...prev, approvers: newApprovers }
    })
  }

  const handleRemoveApprover = (index: number) => {
    setFormData(prev => ({
      ...prev,
      approvers: prev.approvers.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setFormData({
      caption: '',
      imageUrl: '',
      budget: '',
      startDate: '',
      endDate: '',
      programId: '',
      campaignId: '',
      approvers: [],
    })
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.caption.trim()) {
      toast.error('Please enter a caption')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select campaign duration')
      return
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date')
      return
    }
    if (formData.approvers.length === 0) {
      toast.error('Please add at least one approver')
      return
    }
    if (formData.approvers.some(a => !a)) {
      toast.error('Please select all approvers before submitting')
      return
    }
    if (new Set(formData.approvers).size !== formData.approvers.length) {
      toast.error('Duplicate approvers are not allowed')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: formData.caption,
          imageUrl: formData.imageUrl,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          programId: formData.programId || null,
          campaignId: formData.campaignId || null,
          approvers: formData.approvers,
        }),
      })

      if (response.ok) {
        toast.success('Post created and submitted for approval')
        onPostCreated?.()
        onOpenChange(false)
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  const isImageBusy = isUploadingImage || isCompressingImage

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-full max-w-[calc(100%-2rem)] sm:max-w-2xl lg:max-w-4xl',
          'max-h-[92vh] flex flex-col gap-0 p-0 overflow-hidden'
        )}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold tracking-tight pr-8">
            Create New Post for Approval
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a social media post and submit it through your approval chain
          </p>
        </DialogHeader>

        {/* ── Body ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

              {/* LEFT: Caption + Image */}
              <div className="space-y-5">

                {/* Caption */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Label htmlFor="caption" className="font-medium leading-none">
                      Caption <span className="text-destructive ml-0.5">*</span>
                    </Label>
                  </div>
                  <Textarea
                    id="caption"
                    value={formData.caption}
                    onChange={e => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Write your post caption here…"
                    rows={5}
                    required
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right tabular-nums">
                    {formData.caption.length} characters
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Label className="font-medium leading-none">Post Image</Label>
                    <Badge variant="secondary" className="text-xs font-normal ml-1">
                      Optional
                    </Badge>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="sr-only"
                    id="image-upload"
                    tabIndex={-1}
                  />

                  {imagePreview ? (
                    /* Preview state */
                    <div className="relative rounded-xl overflow-hidden border bg-muted">
                      <img
                        src={imagePreview}
                        alt="Post preview"
                        className="w-full h-52 object-cover"
                      />

                      {/* Processing overlay */}
                      {isImageBusy && (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                          {isCompressingImage ? (
                            <>
                              <Zap className="w-7 h-7 text-yellow-400 animate-pulse" />
                              <p className="text-white text-sm font-medium">Compressing image…</p>
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-7 h-7 text-white animate-spin" />
                              <p className="text-white text-sm font-medium">Uploading…</p>
                            </>
                          )}
                        </div>
                      )}

                      {/* Uploaded badge */}
                      {!isImageBusy && formData.imageUrl && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-emerald-500/90 text-white border-0 gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            Uploaded
                          </Badge>
                        </div>
                      )}

                      {/* Remove button */}
                      {!isImageBusy && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          aria-label="Remove image"
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Hover-to-replace strip */}
                      {!isImageBusy && (
                        <label
                          htmlFor="image-upload"
                          className="absolute inset-x-0 bottom-0 flex justify-center pb-3 pt-8 opacity-0 hover:opacity-100 transition-opacity cursor-pointer bg-gradient-to-t from-black/50 to-transparent"
                        >
                          <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">
                            Click to replace
                          </span>
                        </label>
                      )}
                    </div>
                  ) : (
                    /* Dropzone state */
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={cn(
                        'relative rounded-xl border-2 border-dashed h-52 flex flex-col items-center justify-center',
                        'transition-all duration-150',
                        isDragOver
                          ? 'border-primary bg-primary/5 scale-[1.01]'
                          : 'border-border hover:border-primary/50 hover:bg-muted/40'
                      )}
                    >
                      {/* Full-area clickable label */}
                      <label
                        htmlFor="image-upload"
                        className="absolute inset-0 cursor-pointer rounded-xl"
                        aria-label="Upload image"
                      />

                      <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                            isDragOver ? 'bg-primary/10' : 'bg-muted'
                          )}
                        >
                          <Upload
                            className={cn(
                              'w-5 h-5 transition-colors',
                              isDragOver ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                        </div>
                        <div className="text-center space-y-0.5">
                          <p className="text-sm font-medium">
                            {isDragOver ? 'Drop image here' : 'Upload a post image'}
                          </p>
                          <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF · Auto-compressed if &gt;5 MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Settings + Approval Chain */}
              <div className="space-y-5">

                {/* Program & Campaign */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="program" className="text-sm font-medium">
                      Program
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={formData.programId}
                      onValueChange={value => setFormData(prev => ({ ...prev, programId: value }))}
                    >
                      <SelectTrigger id="program">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map(program => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name} — {program.campus}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign" className="text-sm font-medium">
                      Campaign
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={formData.campaignId}
                      onValueChange={value => setFormData(prev => ({ ...prev, campaignId: value }))}
                    >
                      <SelectTrigger id="campaign">
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget & Dates */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Label className="font-medium leading-none">Campaign Details</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="budget" className="text-xs text-muted-foreground">
                        Budget
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="budget"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.budget}
                          onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                        Start Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                        End Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Approval Chain */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Label className="font-medium leading-none">
                        Approval Chain <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      {formData.approvers.length > 0 && (
                        <Badge variant="secondary" className="text-xs font-normal ml-1 shrink-0">
                          {formData.approvers.length} / 5
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData(prev => ({ ...prev, approvers: [...prev.approvers, ''] }))
                      }
                      disabled={formData.approvers.length >= 5}
                      className="h-8 text-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Approver
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Approvers are notified in order — each must approve before the next can review.
                  </p>

                  <div className="space-y-2 mt-1">
                    {formData.approvers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-7 border-2 border-dashed rounded-xl text-center">
                        <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No approvers yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          Click &ldquo;Add Approver&rdquo; to build your chain
                        </p>
                      </div>
                    ) : (
                      formData.approvers.map((approverId, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {/* Numbered step circle */}
                          <div
                            className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                              approverId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground border-2 border-dashed'
                            )}
                          >
                            {index + 1}
                          </div>

                          <Select
                            value={approverId}
                            onValueChange={value => handleApproverChange(index, value)}
                          >
                            <SelectTrigger
                              className={cn('flex-1 h-9', !approverId && 'border-dashed')}
                            >
                              <SelectValue placeholder={`Select approver ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter(
                                  u =>
                                    !formData.approvers.includes(u.id) || u.id === approverId
                                )
                                .map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    <div className="flex flex-col py-0.5">
                                      <span className="font-medium">{user.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {user.email}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>

                          <button
                            type="button"
                            onClick={() => handleRemoveApprover(index)}
                            aria-label={`Remove approver ${index + 1}`}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-t bg-muted/20">
            <p className="hidden sm:block text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Required fields
            </p>
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || isImageBusy}
                className="min-w-[190px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : isImageBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing image…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
