'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, Check, X, AlertCircle, Trash2 } from 'lucide-react'
import { PART_CATALOGS } from '@/lib/constants/part-catalogs'
import { getManufacturers, createManufacturer } from '@/app/actions/manufacturer'
import { Manufacturer } from '@/lib/types/database.types'

export interface LineItem {
  supplier_part_number: string
  description: string
  uom?: string
  qty_breaks: Array<{
    min_qty: number
    unit_price: number
  }>
  lead_time_days?: number
  moq?: number
  catalog_code?: string
  sub_catalog_code?: string
  manufacturer_id?: string
  manufacturer_name?: string // For display if needed, though id is source of truth
  sku?: string
  attributes?: Record<string, string>
}

interface EditLineItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: LineItem
  onSave: (updatedItem: LineItem) => void
}

export function EditLineItemDialog({ open, onOpenChange, data, onSave }: EditLineItemDialogProps) {
  const { toast } = useToast()
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  
  // Add Manufacturer State
  const [showAddManufacturerConfirm, setShowAddManufacturerConfirm] = useState(false)
  const [isAddingManufacturer, setIsAddingManufacturer] = useState(false)
  const [newManufacturerName, setNewManufacturerName] = useState('')
  const [isCreatingManufacturer, setIsCreatingManufacturer] = useState(false)

  // Form State
  const [formData, setFormData] = useState<LineItem>(data)

  useEffect(() => {
    if (open) {
      setFormData(data) // Reset form data when dialog opens
      
      const fetchManufacturers = async () => {
        try {
          const { data: mfgData, error } = await getManufacturers()
          if (error) {
            console.error('Error fetching manufacturers:', error)
          }
          if (mfgData) setManufacturers(mfgData)
        } catch (err) {
          console.error('Error fetching manufacturers:', err)
        }
      }

      fetchManufacturers()

      // Reset UI states
      setShowAddManufacturerConfirm(false)
      setIsAddingManufacturer(false)
      setNewManufacturerName('')
    }
  }, [open, data])

  const handleCreateManufacturer = async () => {
    if (!newManufacturerName.trim()) return

    setIsCreatingManufacturer(true)
    try {
      const { data: newMfg, error } = await createManufacturer(newManufacturerName.trim())

      if (error) throw new Error(error)

      if (newMfg) {
        setManufacturers(prev => [...prev, newMfg].sort((a, b) => a.name.localeCompare(b.name)))
        setFormData(prev => ({ ...prev, manufacturer_id: newMfg.id }))
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

  const getSelectedCatalog = () => {
    return PART_CATALOGS.find(c => c.code === formData.catalog_code)
  }

  const handleAttributeChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value
      }
    }))
  }

  const handleChange = (field: keyof LineItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateQtyBreak = (index: number, field: 'min_qty' | 'unit_price', value: number) => {
    const newBreaks = [...formData.qty_breaks]
    newBreaks[index] = { ...newBreaks[index], [field]: value }
    setFormData(prev => ({ ...prev, qty_breaks: newBreaks }))
  }

  const addQtyBreak = () => {
    setFormData(prev => ({
      ...prev,
      qty_breaks: [...prev.qty_breaks, { min_qty: 1, unit_price: 0 }]
    }))
  }

  const removeQtyBreak = (index: number) => {
    if (formData.qty_breaks.length <= 1) return // Prevent removing the last one
    setFormData(prev => ({
      ...prev,
      qty_breaks: prev.qty_breaks.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    // Basic validation if needed
    if (!formData.supplier_part_number || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Part number and description are required",
        variant: "destructive"
      })
      return
    }

    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Line Item</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_part_number">Supplier Part Number *</Label>
              <Input
                id="supplier_part_number"
                value={formData.supplier_part_number}
                onChange={(e) => handleChange('supplier_part_number', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder={`SKU-${formData.supplier_part_number}`}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">UOM</Label>
              <Input
                id="uom"
                value={formData.uom || ''}
                onChange={(e) => handleChange('uom', e.target.value)}
                placeholder="EA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead_time">Lead Time (Days)</Label>
              <Input
                id="lead_time"
                type="number"
                value={formData.lead_time_days || ''}
                onChange={(e) => handleChange('lead_time_days', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moq">MOQ</Label>
              <Input
                id="moq"
                type="number"
                value={formData.moq || ''}
                onChange={(e) => handleChange('moq', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              {!isAddingManufacturer ? (
                <Select 
                  value={formData.manufacturer_id || ''} 
                  onValueChange={(val) => {
                    if (val === 'new-manufacturer') {
                      setShowAddManufacturerConfirm(true)
                    } else {
                      handleChange('manufacturer_id', val)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-manufacturer" className="text-primary font-medium">
                      <div className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Manufacturer
                      </div>
                    </SelectItem>
                    {manufacturers.length > 0 ? (
                      manufacturers.map(m => (
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

          {/* Categorization */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Categorization</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="catalog">Catalog</Label>
                <Select 
                  value={formData.catalog_code || ''} 
                  onValueChange={(val) => {
                    setFormData(prev => ({
                      ...prev,
                      catalog_code: val,
                      sub_catalog_code: '', // Reset sub-catalog
                      attributes: {}, // Reset attributes
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Catalog" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {PART_CATALOGS.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub_catalog">Sub-Catalog</Label>
                <Select 
                  value={formData.sub_catalog_code || ''} 
                  onValueChange={(val) => handleChange('sub_catalog_code', val)}
                  disabled={!formData.catalog_code}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sub-Catalog" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {getSelectedCatalog()?.subCatalogs.map(sc => (
                      <SelectItem key={sc.code} value={sc.code}>{sc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Attributes */}
            {formData.catalog_code && getSelectedCatalog()?.details && getSelectedCatalog()!.details.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted/20 rounded-lg">
                {getSelectedCatalog()!.details.map(attr => (
                  <div key={attr} className="space-y-2">
                    <Label htmlFor={`attr-${attr}`}>{attr}</Label>
                    <Input
                      id={`attr-${attr}`}
                      value={formData.attributes?.[attr] || ''}
                      onChange={(e) => handleAttributeChange(attr, e.target.value)}
                      placeholder={`Enter ${attr}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="border-t pt-4">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Pricing Breaks</h3>
              <Button size="sm" variant="outline" onClick={addQtyBreak}>
                <Plus className="h-4 w-4 mr-2" />
                Add Break
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground mb-2">
                <div className="col-span-2">Min Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div></div>
              </div>
              
              {formData.qty_breaks.map((qb, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 items-center">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={qb.min_qty}
                      onChange={(e) => updateQtyBreak(index, 'min_qty', parseFloat(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={qb.unit_price}
                      onChange={(e) => updateQtyBreak(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      min={0}
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQtyBreak(index)}
                      disabled={formData.qty_breaks.length <= 1}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

