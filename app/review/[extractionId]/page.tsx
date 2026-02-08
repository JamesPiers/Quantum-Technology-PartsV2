'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, CheckCircle, XCircle, ExternalLink, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { Extraction } from '@/lib/types/database.types'
import { EditLineItemDialog, LineItem } from '@/components/edit-line-item-dialog'

export default function ReviewPage({
  params,
}: {
  params: { extractionId: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  
  // Edit Dialog State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [supplierInfo, setSupplierInfo] = useState({
    supplier_name: '',
    quote_number: '',
    quote_date: '',
    currency: '',
    valid_until: '',
  })
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showRawResponse, setShowRawResponse] = useState(false)

  // Fetch extraction data
  const { data: extraction, isLoading, error } = useQuery({
    queryKey: ['extraction', params.extractionId],
    queryFn: async () => {
      const response = await fetch(`/api/extractions/${params.extractionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch extraction')
      }
      
      return response.json() as Promise<Extraction & { documents: any }>
    },
  })

  // Initialize state when extraction data is loaded
  useEffect(() => {
    if (extraction?.normalized_json) {
      const normalized = extraction.normalized_json as any
      setSupplierInfo({
        supplier_name: normalized.supplier_name || '',
        quote_number: normalized.quote_number || '',
        quote_date: normalized.quote_date || '',
        currency: normalized.currency || '',
        valid_until: normalized.valid_until || '',
      })
      setLineItems(normalized.line_items || [])
    }

    // Get signed URL for document
    if (extraction?.documents?.file_path) {
      fetch(`/api/documents/${extraction.document_id}/url`)
        .then(res => res.json())
        .then(data => setDocumentUrl(data.signedUrl))
        .catch(err => console.error('Failed to get document URL:', err))
    }
  }, [extraction])

  const handleApprove = async () => {
    setIsApproving(true)

    try {
      const response = await fetch(
        `/api/extractions/${params.extractionId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supplierInfo,
            lineItems,
          }),
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
      const response = await fetch(
        `/api/extractions/${params.extractionId}/reject`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to reject extraction')
      }

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

  const updateSupplierInfo = (field: string, value: string) => {
    setSupplierInfo({ ...supplierInfo, [field]: value })
  }

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index)
    setIsEditDialogOpen(true)
  }

  const handleSaveLineItem = (updatedItem: LineItem) => {
    if (editingItemIndex === null) return
    const newItems = [...lineItems]
    newItems[editingItemIndex] = updatedItem
    setLineItems(newItems)
    setIsEditDialogOpen(false)
    setEditingItemIndex(null)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Failed to load extraction'}
            </p>
          </CardContent>
        </Card>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Review Extraction</h1>
            <p className="text-muted-foreground">
              Review the extracted data and approve or reject
            </p>
          </div>
          {documentUrl && (
            <Button variant="outline" asChild>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Document
              </a>
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Supplier Name</Label>
                  <Input
                    value={supplierInfo.supplier_name}
                    onChange={(e) => updateSupplierInfo('supplier_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Quote Number</Label>
                  <Input
                    value={supplierInfo.quote_number}
                    onChange={(e) => updateSupplierInfo('quote_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Quote Date</Label>
                  <Input
                    type="date"
                    value={supplierInfo.quote_date}
                    onChange={(e) => updateSupplierInfo('quote_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input
                    value={supplierInfo.currency}
                    onChange={(e) => updateSupplierInfo('currency', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={supplierInfo.valid_until}
                    onChange={(e) => updateSupplierInfo('valid_until', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items ({lineItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Part Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">UOM</TableHead>
                    <TableHead className="w-[150px]">Pricing</TableHead>
                    <TableHead className="w-[100px]">Lead Time</TableHead>
                    <TableHead className="w-[100px]">MOQ</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{item.supplier_part_number}</div>
                        {item.sku && <div className="text-xs text-muted-foreground">{item.sku}</div>}
                      </TableCell>
                      <TableCell>
                        <div>{item.description}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.uom || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.qty_breaks?.map((qb, qbIndex) => (
                            <div key={qbIndex}>
                              {qb.min_qty}+: ${qb.unit_price}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{item.lead_time_days ? `${item.lead_time_days} days` : '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.moq || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(index)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  size="lg"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve & Import to Catalog
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isApproving || isRejecting}
                  variant="destructive"
                  size="lg"
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

          {/* AI Logs Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Prompt Log */}
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setShowPrompt(!showPrompt)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">AI Prompt Log</CardTitle>
                  {showPrompt ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              {showPrompt && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Provider</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <code className="text-sm">
                          {extraction?.provider || 'Unknown'}
                        </code>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Prompt Sent to AI</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md max-h-96 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                          {extraction?.provider === 'mock'
                            ? 'Mock provider does not use a prompt. It returns sample data for testing purposes.'
                            : 'Extract the following information from this supplier quote document:\n\n' +
                              '1. Supplier Information:\n' +
                              '   - supplier_name (string, required)\n' +
                              '   - quote_number (string, optional)\n' +
                              '   - quote_date (string, ISO format YYYY-MM-DD, optional)\n' +
                              '   - currency (string, 3-letter ISO code, optional)\n' +
                              '   - valid_until (string, ISO format YYYY-MM-DD, optional)\n' +
                              '   - notes (string, optional)\n\n' +
                              '2. Line Items (array of objects):\n' +
                              '   For each part/product in the quote:\n' +
                              '   - supplier_part_number (string, required)\n' +
                              '   - description (string, required)\n' +
                              '   - uom (string, unit of measure like EA, LB, etc., optional)\n' +
                              '   - qty_breaks (array of price breaks, required):\n' +
                              '     * min_qty (number, minimum quantity for this price)\n' +
                              '     * unit_price (number, price per unit at this quantity)\n' +
                              '   - lead_time_days (number, optional)\n' +
                              '   - moq (number, minimum order quantity, optional)\n\n' +
                              'Return the extracted data as a structured JSON object.'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* AI Raw Response */}
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setShowRawResponse(!showRawResponse)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">AI Raw Response</CardTitle>
                  {showRawResponse ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              {showRawResponse && (
                <CardContent>
                  <div>
                    <Label className="text-sm font-semibold">Raw Response from AI</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                        {JSON.stringify(extraction?.raw_json, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      {editingItemIndex !== null && lineItems[editingItemIndex] && (
        <EditLineItemDialog 
          open={isEditDialogOpen} 
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setEditingItemIndex(null)
          }}
          data={lineItems[editingItemIndex]}
          onSave={handleSaveLineItem}
        />
      )}
    </div>
  )
}
