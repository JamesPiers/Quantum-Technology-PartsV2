'use client'

import { PartWithDetails, PartPriceWithRelations } from '@/lib/types/database.types'
import { getCatalogByCode, getSubCatalogByCode } from '@/lib/utils/catalog-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Package, 
  DollarSign, 
  Building2, 
  FileText, 
  TrendingUp,
  Info,
  ExternalLink
} from 'lucide-react'

interface PartDetailContentProps {
  part: PartWithDetails
}

export function PartDetailContent({ part }: PartDetailContentProps) {
  const catalog = part.catalog_code ? getCatalogByCode(part.catalog_code) : null
  const subCatalog = (part.catalog_code && part.sub_catalog_code) 
    ? getSubCatalogByCode(part.catalog_code, part.sub_catalog_code) 
    : null

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDocumentUrl = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/url`)
      if (response.ok) {
        const data = await response.json()
        return data.url
      }
    } catch (error) {
      console.error('Failed to get document URL', error)
    }
    return null
  }

  const handleViewDocument = async (documentId: string) => {
    const url = await getDocumentUrl(documentId)
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{part.name}</h2>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                SKU: {part.sku}
              </span>
              <span>Part #: {part.supplier_part_number}</span>
            </div>
          </div>
          {part.current_price && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(part.current_price.unit_price, part.current_price.currency)}
              </div>
              {part.current_price.moq && (
                <div className="text-sm text-muted-foreground">
                  MOQ: {part.current_price.moq}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Part Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Part Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {catalog && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Classification
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                      {catalog.name} ({catalog.code})
                    </div>
                    {subCatalog && (
                      <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {subCatalog.name} ({subCatalog.code})
                      </div>
                    )}
                  </div>
                </div>
              )}

              {part.description && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </div>
                  <p className="text-sm">{part.description}</p>
                </div>
              )}

              {part.attributes && Object.keys(part.attributes).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Attributes
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(part.attributes).map(([key, value]) => (
                      <div key={key} className="border rounded-lg p-3">
                        <div className="text-xs text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm font-medium">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {part.drawing_url && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Technical Drawing
                  </div>
                  <a
                    href={part.drawing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View Drawing
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Created
                </div>
                <p className="text-sm">{formatDate(part.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Price History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price History
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({part.prices.length} {part.prices.length === 1 ? 'record' : 'records'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {part.prices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pricing information available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Price</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Valid Period</TableHead>
                        <TableHead>MOQ</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {part.prices.map((price: PartPriceWithRelations) => {
                        const isCurrent = part.current_price?.id === price.id
                        return (
                          <TableRow key={price.id} className={isCurrent ? 'bg-green-50' : ''}>
                            <TableCell className="font-medium">
                              {formatCurrency(price.unit_price, price.currency)}
                              {isCurrent && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Current
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {price.supplier ? (
                                <div>
                                  <div className="font-medium">{price.supplier.name}</div>
                                  {price.supplier.email && (
                                    <div className="text-xs text-muted-foreground">
                                      {price.supplier.email}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>{formatDate(price.valid_from)}</div>
                              <div className="text-muted-foreground">
                                to {formatDate(price.valid_through) || 'Present'}
                              </div>
                            </TableCell>
                            <TableCell>{price.moq || '-'}</TableCell>
                            <TableCell>
                              {price.lead_time_days ? `${price.lead_time_days} days` : '-'}
                            </TableCell>
                            <TableCell>
                              {price.document ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDocument(price.document!.id)}
                                  className="h-auto py-1 px-2"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  View Quote
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">Manual entry</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(price.created_at)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Supplier Info */}
          {part.current_price?.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Current Supplier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium">
                    {part.current_price.supplier.name}
                  </div>
                  {part.current_price.supplier.email && (
                    <div className="text-sm text-muted-foreground">
                      {part.current_price.supplier.email}
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="font-medium">
                      {part.current_price.supplier.currency}
                    </span>
                  </div>
                  {part.current_price.lead_time_days && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lead Time:</span>
                      <span className="font-medium">
                        {part.current_price.lead_time_days} days
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {part.prices.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price Records:</span>
                    <span className="font-medium">{part.prices.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Suppliers:</span>
                    <span className="font-medium">
                      {new Set(part.prices.map(p => p.supplier_id)).size}
                    </span>
                  </div>
                  {part.prices.length > 1 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Lowest Price:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            Math.min(...part.prices.map(p => p.unit_price)),
                            part.prices[0].currency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Highest Price:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            Math.max(...part.prices.map(p => p.unit_price)),
                            part.prices[0].currency
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Quote */}
          {part.current_price?.document && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Latest Quote
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Document Type:</span>
                  <span className="font-medium capitalize">
                    {part.current_price.document.doc_type}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">
                    {part.current_price.document.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploaded:</span>
                  <span className="font-medium">
                    {formatDate(part.current_price.document.created_at)}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleViewDocument(part.current_price!.document!.id)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Document
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

