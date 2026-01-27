'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NewPromotionCodeDialog } from './new-promotion-code-dialog'

export function NewPromotionCodeButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Promotion Code
      </Button>
      <NewPromotionCodeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}
