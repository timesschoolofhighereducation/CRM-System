'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NewCampaignDialog } from './new-campaign-dialog'

interface NewCampaignButtonProps {
  onSuccess?: () => void
}

export function NewCampaignButton({ onSuccess }: NewCampaignButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Campaign
      </Button>
      <NewCampaignDialog open={open} onOpenChange={setOpen} onSuccess={onSuccess} />
    </>
  )
}
