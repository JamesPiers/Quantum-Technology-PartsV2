'use client'

import { useParams, useRouter } from 'next/navigation'
import { usePart } from '@/lib/hooks/use-parts'
import { Button } from '@/components/ui/button'
import { PartDetailContent } from '@/components/part-detail-content'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function PartDetailPage() {
  const params = useParams()
  const router = useRouter()
  const partId = params.id as string

  const { data: part, isLoading, error } = usePart(partId)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !part) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Part not found</h2>
          <p className="text-muted-foreground mb-4">
            The part you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/parts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Parts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/parts')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Parts
        </Button>
        
        <PartDetailContent part={part} />
      </div>
    </div>
  )
}

