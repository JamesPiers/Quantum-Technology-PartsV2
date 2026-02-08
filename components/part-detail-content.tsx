'use client'

import { useState, useEffect } from 'react'
import { PartWithDetails, PartPriceWithRelations, Manufacturer } from '@/lib/types/database.types'
import { getCatalogByCode, getSubCatalogByCode } from '@/lib/utils/catalog-utils'
import { useUpdatePart } from '@/lib/hooks/use-parts'
import { getManufacturers, createManufacturer } from '@/app/actions/manufacturer'
import { PART_CATALOGS } from '@/lib/constants/part-catalogs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  ExternalLink,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface PartDetailContentProps {
  part: PartWithDetails
}

export function PartDetailContent({ part }: PartDetailContentProps) {
  const { toast } = useToast()
  const updatePart = useUpdatePart(part.id)
  const [isEditing, setIsEditing] = useState(false)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  
  // Add Manufacturer State
  const [showAddManufacturerConfirm, setShowAddManufacturerConfirm] = useState(false)
  const [isAddingManufacturer, setIsAddingManufacturer] = useState(false)
  const [newManufacturerName, setNewManufacturerName] = useState('')
  const [isCreatingManufacturer, setIsCreatingManufacturer] = useState(false)

  const [formData, setFormData] = useState({
    name: part.name,
    sku: part.sku,
    supplier_part_number: part.supplier_part_number,
    description: part.description || '',
    catalog_code: part.catalog_code || '',
    sub_catalog_code: part.sub_catalog_code || '',
    manufacturer_id: part.manufacturer_id || '',
    drawing_url: part.drawing_url || '',
    attributes: part.attributes || {} as Record<string, any>
  })

  // Fetch manufacturers when editing starts
  useEffect(() => {
    if (isEditing && manufacturers.length === 0) {
      getManufacturers().then(({ data }) => {
        if (data) setManufacturers(data)
      })
    }
  }, [isEditing, manufacturers.length])

  // Update form data when part changes
  useEffect(() => {
    setFormData({
      name: part.name,
      sku: part.sku,
      supplier_part_number: part.supplier_part_number,
      description: part.description || '',
      catalog_code: part.catalog_code || '',
      sub_catalog_code: part.sub_catalog_code || '',
      manufacturer_id: part.manufacturer_id || '',
      drawing_url: part.drawing_url || '',
      attributes: part.attributes || {}
    })
  }, [part])

  const handleCreateManufacturer = async () => {
    if (!newManufacturerName.trim()) return

    setIsCreatingManufacturer(true)
    try {
      const { data, error } = await createManufacturer(newManufacturerName.trim())

      if (error) throw new Error(error)

      if (data) {
        setManufacturers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        setFormData(prev => ({ ...prev, manufacturer_id: data.id }))
        setIsAddingManufacturer(false)
        setShowAddManufacturerConfirm(false)
        setNewManufacturerName('')
        toast({
          title: "Success",
          description: "New manufacturer added successfully",
        })
      }
    } catch (error) {
      console.error('Error creating manufacturer:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create manufacturer",
        variant: "destructive"
      })
    } finally {
      setIsCreatingManufacturer(false)
    }
  }

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

  const handleSave = async () => {
    try {
      await updatePart.mutateAsync({
        name: formData.name,
        sku: formData.sku,
        supplier_part_number: formData.supplier_part_number,
        description: formData.description || null,
        catalog_code: formData.catalog_code || null,
        sub_catalog_code: formData.sub_catalog_code || null,
        manufacturer_id: formData.manufacturer_id || null,
        drawing_url: formData.drawing_url || null,
        attributes: formData.attributes
      })
      setIsEditing(false)
      toast({
        title: "Part updated",
        description: "The part details have been successfully updated.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update part details.",
      })
    }
  }

  const handleAttributeChange = (oldKey: string, newKey: string, value: string) => {
    const newAttributes = { ...formData.attributes }
    if (oldKey !== newKey) {
      delete newAttributes[oldKey]
    }
    newAttributes[newKey] = value
    setFormData({ ...formData, attributes: newAttributes })
  }

  const handleAttributeDelete = (key: string) => {
    const newAttributes = { ...formData.attributes }
    delete newAttributes[key]
    setFormData({ ...formData, attributes: newAttributes })
  }

  const handleAddAttribute = () => {
    const newAttributes = { ...formData.attributes }
    let counter = 1
    while (newAttributes[`new_attribute_${counter}`]) {
      counter++
    }
    newAttributes[`new_attribute_${counter}`] = ''
    setFormData({ ...formData, attributes: newAttributes })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4 max-w-xl">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplier_part_number">Part #</Label>
                    <Input
                      id="supplier_part_number"
                      value={formData.supplier_part_number}
                      onChange={(e) => setFormData({ ...formData, supplier_part_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  {!isAddingManufacturer ? (
                    <Select
                      value={formData.manufacturer_id}
                      onValueChange={(val) => {
                        if (val === 'new-manufacturer') {
                          setShowAddManufacturerConfirm(true)
                        } else {
                          setFormData({ ...formData, manufacturer_id: val })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-manufacturer" className="text-primary font-medium">
                          <div className="flex items-center">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Manufacturer
                          </div>
                        </SelectItem>
                        {manufacturers.length > 0 ? (
                          manufacturers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">No manufacturers found</div>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={newManufacturerName}
                        onChange={(e) => setNewManufacturerName(e.target.value)}
                        placeholder="New Manufacturer Name"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleCreateManufacturer} disabled={isCreatingManufacturer}>
                        {isCreatingManufacturer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAddingManufacturer(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {showAddManufacturerConfirm && !isAddingManufacturer && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-md border border-border">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div className="space-y-2 flex-1">
                          <p className="text-sm font-medium">Are you sure you want to add a new manufacturer?</p>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="default" 
                              onClick={() => {
                                setShowAddManufacturerConfirm(false)
                                setIsAddingManufacturer(true)
                              }}
                            >
                              Yes, Add New
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setShowAddManufacturerConfirm(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-2">{part.name}</h2>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      SKU: {part.sku}
                    </span>
                    <span>Part #: {part.supplier_part_number}</span>
                  </div>
                  {part.manufacturer && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Manufacturer: <span className="font-medium text-foreground">{part.manufacturer.name}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-4 ml-4">
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={updatePart.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {updatePart.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Part
                </Button>
              )}
            </div>

            {part.current_price && !isEditing && (
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
              {isEditing ? (
                <div className="space-y-4">
                  {/* Catalog Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Catalog</Label>
                      <Select
                        value={formData.catalog_code}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          catalog_code: value,
                          sub_catalog_code: '' // Reset sub-catalog when catalog changes
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select catalog" />
                        </SelectTrigger>
                        <SelectContent>
                          {PART_CATALOGS.map((cat) => (
                            <SelectItem key={cat.code} value={cat.code}>
                              {cat.name} ({cat.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Sub-Catalog</Label>
                      <Select
                        value={formData.sub_catalog_code}
                        onValueChange={(value) => setFormData({ ...formData, sub_catalog_code: value })}
                        disabled={!formData.catalog_code}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub-catalog" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.catalog_code && PART_CATALOGS
                            .find(c => c.code === formData.catalog_code)
                            ?.subCatalogs.map((sub) => (
                              <SelectItem key={sub.code} value={sub.code}>
                                {sub.name} ({sub.code})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="drawing_url">Technical Drawing URL</Label>
                    <Input
                      id="drawing_url"
                      value={formData.drawing_url}
                      onChange={(e) => setFormData({ ...formData, drawing_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-3">
                    {/* Catalog Specific Attributes */}
                    {formData.catalog_code && (
                      (() => {
                        const selectedCatalog = PART_CATALOGS.find(c => c.code === formData.catalog_code);
                        const requiredAttributes = selectedCatalog?.details || [];
                        
                        if (requiredAttributes.length > 0) {
                          return (
                            <div className="space-y-3 border-b pb-4">
                              <Label className="text-base font-semibold">Catalog Attributes</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {requiredAttributes.map(attrName => (
                                  <div key={attrName} className="space-y-2">
                                    <Label>{attrName}</Label>
                                    <Input 
                                      value={formData.attributes[attrName] || ''}
                                      onChange={(e) => handleAttributeChange(attrName, attrName, e.target.value)}
                                      placeholder={`Enter ${attrName}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()
                    )}

                    <div className="flex items-center justify-between">
                      <Label>Additional Attributes</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddAttribute}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Attribute
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(formData.attributes)
                        .filter(([key]) => {
                          const selectedCatalog = PART_CATALOGS.find(c => c.code === formData.catalog_code);
                          const requiredAttributes = selectedCatalog?.details || [];
                          return !requiredAttributes.includes(key);
                        })
                        .map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <Input
                            className="flex-1"
                            value={key}
                            onChange={(e) => handleAttributeChange(key, e.target.value, String(value))}
                            placeholder="Key"
                          />
                          <Input
                            className="flex-1"
                            value={String(value)}
                            onChange={(e) => handleAttributeChange(key, key, e.target.value)}
                            placeholder="Value"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAttributeDelete(key)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {Object.keys(formData.attributes).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No attributes defined
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
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

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {part.description || "No description available"}
                    </p>
                  </div>

                  {(() => {
                    const catalogDetails = catalog?.details || [];
                    const currentAttributes = part.attributes || {};
                    const hasAnyAttributes = catalogDetails.length > 0 || Object.keys(currentAttributes).length > 0;

                    if (!hasAnyAttributes) return (
                      <div>
                         <div className="text-sm font-medium text-muted-foreground mb-2">
                           Attributes
                         </div>
                         <div className="text-sm text-muted-foreground italic">No attributes available</div>
                      </div>
                    );

                    return (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          Attributes
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Catalog Attributes */}
                          {catalogDetails.map(key => (
                            <div key={key} className="border rounded-lg p-3">
                              <div className="text-xs text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-sm font-medium">
                                {currentAttributes[key] || <span className="text-muted-foreground italic font-normal">Empty</span>}
                              </div>
                            </div>
                          ))}
                          
                          {/* Additional Attributes */}
                          {Object.entries(currentAttributes)
                            .filter(([key]) => !catalogDetails.includes(key))
                            .map(([key, value]) => (
                              <div key={key} className="border rounded-lg p-3">
                                <div className="text-xs text-muted-foreground capitalize">
                                  {key.replace(/_/g, ' ')}
                                </div>
                                <div className="text-sm font-medium">{String(value)}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Technical Drawing
                    </div>
                    {part.drawing_url ? (
                      <a
                        href={part.drawing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Drawing
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No drawing available</p>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Created
                    </div>
                    <p className="text-sm">{formatDate(part.created_at)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Price History - Always visible, read only for now as per requirements only fields edit */}
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
