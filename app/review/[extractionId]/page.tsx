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
import { Loader2, CheckCircle, XCircle, ExternalLink, Pencil } from 'lucide-react'
import { Extraction } from '@/lib/types/database.types'

interface LineItem {
  supplier_part_number: string
  description: string
  uom?: string
  qty_breaks: Array<{
    min_qty: number
    unit_price: number
  }>
  lead_time_days?: number
  moq?: number
}

export default function ReviewPage({
  params,
}: {
  params: { extractionId: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [editingLineItem, setEditingLineItem] = useState<number | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [supplierInfo, setSupplierInfo] = useState({
    supplier_name: '',
    quote_number: '',
    quote_date: '',
    currency: '',
    valid_until: '',
  })
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)

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

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedLineItems = [...lineItems]
    updatedLineItems[index] = { ...updatedLineItems[index], [field]: value }
    setLineItems(updatedLineItems)
  }

  const updateSupplierInfo = (field: string, value: string) => {
    setSupplierInfo({ ...supplierInfo, [field]: value })
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
                        {editingLineItem === index ? (
                          <Input
                            value={item.supplier_part_number}
                            onChange={(e) =>
                              updateLineItem(index, 'supplier_part_number', e.target.value)
                            }
                            className="h-8"
                          />
                        ) : (
                          <div className="font-medium">{item.supplier_part_number}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingLineItem === index ? (
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(index, 'description', e.target.value)
                            }
                            className="h-8"
                          />
                        ) : (
                          <div>{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingLineItem === index ? (
                          <Input
                            value={item.uom || ''}
                            onChange={(e) => updateLineItem(index, 'uom', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <div>{item.uom || '-'}</div>
                        )}
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
                        {editingLineItem === index ? (
                          <Input
                            type="number"
                            value={item.lead_time_days || ''}
                            onChange={(e) =>
                              updateLineItem(index, 'lead_time_days', parseInt(e.target.value))
                            }
                            className="h-8"
                          />
                        ) : (
                          <div>{item.lead_time_days ? `${item.lead_time_days} days` : '-'}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingLineItem === index ? (
                          <Input
                            type="number"
                            value={item.moq || ''}
                            onChange={(e) =>
                              updateLineItem(index, 'moq', parseInt(e.target.value))
                            }
                            className="h-8"
                          />
                        ) : (
                          <div>{item.moq || '-'}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingLineItem === index ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLineItem(null)}
                          >
                            Save
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLineItem(index)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
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
        </div>
      </div>
    </div>
  )
}

