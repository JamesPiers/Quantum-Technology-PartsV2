'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Extraction } from '@/lib/types/database.types'

export default function ReviewPage({
  params,
}: {
  params: { extractionId: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  // Fetch extraction data
  const { data: extraction, isLoading } = useQuery({
    queryKey: ['extraction', params.extractionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extractions')
        .select('*, documents(*)')
        .eq('id', params.extractionId)
        .single()

      if (error) throw error
      return data as Extraction & { documents: any }
    },
  })

  const handleApprove = async () => {
    setIsApproving(true)

    try {
      const response = await fetch(
        `/api/extractions/${params.extractionId}/approve`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to approve extraction')
      }

      const result = await response.json()

      toast({
        title: 'Approved',
        description: `Created ${result.partsCreated} parts and ${result.pricesCreated} prices`,
      })

      router.push('/parts')
    } catch (error) {
      console.error('Approve error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Approval failed',
        variant: 'destructive',
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)

    try {
      await supabase
        .from('extractions')
        .update({ status: 'rejected' })
        .eq('id', params.extractionId)

      toast({
        title: 'Rejected',
        description: 'Extraction has been rejected',
      })

      router.push('/upload')
    } catch (error) {
      console.error('Reject error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Rejection failed',
        variant: 'destructive',
      })
    } finally {
      setIsRejecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!extraction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Extraction not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const normalized = extraction.normalized_json as any

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Review Extraction</h1>
          <p className="text-muted-foreground">
            Review the extracted data and approve or reject
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: PDF Viewer (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[8.5/11] bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">PDF Viewer Placeholder</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                File: {extraction.documents?.file_path || 'N/A'}
              </p>
            </CardContent>
          </Card>

          {/* Right: Extracted Data */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Supplier Name</Label>
                  <Input value={normalized.supplier_name || ''} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quote Number</Label>
                    <Input value={normalized.quote_number || ''} readOnly />
                  </div>
                  <div>
                    <Label>Quote Date</Label>
                    <Input value={normalized.quote_date || ''} readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Currency</Label>
                    <Input value={normalized.currency || ''} readOnly />
                  </div>
                  <div>
                    <Label>Valid Until</Label>
                    <Input value={normalized.valid_until || ''} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Line Items ({normalized.line_items?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {normalized.line_items?.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">
                        Part #: {item.supplier_part_number}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Pricing:</span>
                        {item.qty_breaks?.map((qb: any, qbIndex: number) => (
                          <div key={qbIndex} className="ml-4">
                            {qb.min_qty}+ qty: ${qb.unit_price}
                          </div>
                        ))}
                      </div>
                      {item.lead_time_days && (
                        <div className="text-sm">
                          Lead Time: {item.lead_time_days} days
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="w-full"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isApproving || isRejecting}
                    variant="destructive"
                    className="w-full"
                  >
                    {isRejecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

