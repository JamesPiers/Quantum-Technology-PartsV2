'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  ExternalLink,
  Package,
  Building2,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface DocumentDetails {
  document: {
    id: string
    doc_type: string
    status: string
    created_at: string
    supplier: {
      id: string
      name: string
      email?: string
      currency?: string
    } | null
  }
  signedUrl: string | null
  relatedParts: Array<{
    id: string
    sku: string
    supplier_part_number: string
    name: string
    catalog_code?: string
    price_from_document: {
      unit_price: number
      currency: string
      moq?: number
      lead_time_days?: number
      supplier?: {
        name: string
      }
    }
  }>
  extractions: Array<{
    id: string
    status: string
    created_at: string
  }>
}

interface DocumentDetailModalProps {
  documentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartClick?: (partId: string) => void
}

export function DocumentDetailModal({
  documentId,
  open,
  onOpenChange,
  onPartClick,
}: DocumentDetailModalProps) {
  const [details, setDetails] = useState<DocumentDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = useCallback(async (docId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/documents/${docId}/details`)
      if (!response.ok) {
        throw new Error('Failed to load document details')
      }
      const data = await response.json()
      setDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && documentId) {
      fetchDetails(documentId)
    }
    if (!open) {
      setDetails(null)
      setError(null)
    }
  }, [open, documentId, fetchDetails])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Details
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {details && !loading && (
          <div className="space-y-6">
            {/* Document Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Type</div>
                    <div className="text-sm font-medium capitalize">{details.document.doc_type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColor(details.document.status)}`}>
                      {details.document.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Uploaded</div>
                    <div className="text-sm font-medium">{formatDate(details.document.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Supplier</div>
                    <div className="text-sm font-medium">
                      {details.document.supplier ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {details.document.supplier.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Unknown</span>
                      )}
                    </div>
                  </div>
                </div>

                {details.signedUrl && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => window.open(details.signedUrl!, '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open PDF Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Parts */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Parts from this Document
                <span className="text-muted-foreground font-normal">
                  ({details.relatedParts.length} {details.relatedParts.length === 1 ? 'part' : 'parts'})
                </span>
              </h3>

              {details.relatedParts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No parts have been linked to this document yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>MOQ</TableHead>
                        <TableHead>Lead Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.relatedParts.map((part) => (
                        <TableRow
                          key={part.id}
                          className={onPartClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                          onClick={() => onPartClick?.(part.id)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{part.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {part.supplier_part_number}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{part.sku}</TableCell>
                          <TableCell className="font-medium text-sm">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              {formatCurrency(
                                part.price_from_document.unit_price,
                                part.price_from_document.currency
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {part.price_from_document.moq || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {part.price_from_document.lead_time_days ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {part.price_from_document.lead_time_days} days
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Extraction History */}
            {details.extractions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  Extraction History
                </h3>
                <div className="space-y-2">
                  {details.extractions.map((ext) => (
                    <div
                      key={ext.id}
                      className="flex items-center justify-between text-sm p-2 rounded border"
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColor(ext.status)}`}>
                        {ext.status.replace('_', ' ')}
                      </span>
                      <span className="text-muted-foreground">{formatDate(ext.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
