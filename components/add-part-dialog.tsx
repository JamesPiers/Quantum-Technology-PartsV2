'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload, FileText, X, Plus, Check, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils/cn'
import { PART_CATALOGS, PartCatalog, SubCatalog } from '@/lib/constants/part-catalogs'
import { getSuppliers, createSupplier } from '@/app/actions/supplier'
import { getManufacturers, createManufacturer } from '@/app/actions/manufacturer'
import { Manufacturer } from '@/lib/types/database.types'

interface AddPartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Supplier {
  id: string
  name: string
  currency: string
}

export function AddPartDialog({ open, onOpenChange, onSuccess }: AddPartDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  
  // Add Supplier State
  const [showAddSupplierConfirm, setShowAddSupplierConfirm] = useState(false)
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false)
  
  // Add Manufacturer State
  const [showAddManufacturerConfirm, setShowAddManufacturerConfirm] = useState(false)
  const [isAddingManufacturer, setIsAddingManufacturer] = useState(false)
  const [newManufacturerName, setNewManufacturerName] = useState('')
  const [isCreatingManufacturer, setIsCreatingManufacturer] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    supplier_part_number: '',
    name: '',
    description: '',
    supplier_id: '',
    manufacturer_id: '',
    unit_price: '',
    currency: 'USD',
    catalog_code: '',
    sub_catalog_code: '',
    attributes: {} as Record<string, string>,
  })

  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch Suppliers
  useEffect(() => {
    if (open) {
      const fetchSuppliers = async () => {
        try {
          const { data, error } = await getSuppliers()
          
          if (error) {
            console.error('Error fetching suppliers:', error)
            toast({
              title: "Error fetching suppliers",
              description: error,
              variant: "destructive"
            })
            return
          }
          
          if (data) setSuppliers(data)
        } catch (err) {
          console.error('Error fetching suppliers:', err)
        }
      }

      const fetchManufacturers = async () => {
        try {
          const { data, error } = await getManufacturers()
          
          if (error) {
            console.error('Error fetching manufacturers:', error)
            // Non-blocking error, just log it
          }
          
          if (data) setManufacturers(data)
        } catch (err) {
          console.error('Error fetching manufacturers:', err)
        }
      }

      fetchSuppliers()
      fetchManufacturers()
      
      // Reset add supplier state
      setShowAddSupplierConfirm(false)
      setIsAddingSupplier(false)
      setNewSupplierName('')

      // Reset add manufacturer state
      setShowAddManufacturerConfirm(false)
      setIsAddingManufacturer(false)
      setNewManufacturerName('')
    }
  }, [open, toast])

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return

    setIsCreatingSupplier(true)
    try {
      const { data, error } = await createSupplier(newSupplierName.trim())

      if (error) throw new Error(error)

      if (data) {
        setSuppliers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        handleChange('supplier_id', data.id)
        handleChange('currency', data.currency)
        setIsAddingSupplier(false)
        setShowAddSupplierConfirm(false)
        setNewSupplierName('')
        toast({
          title: "Success",
          description: "New supplier added successfully",
        })
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create supplier",
        variant: "destructive"
      })
    } finally {
      setIsCreatingSupplier(false)
    }
  }

  const handleCreateManufacturer = async () => {
    if (!newManufacturerName.trim()) return

    setIsCreatingManufacturer(true)
    try {
      const { data, error } = await createManufacturer(newManufacturerName.trim())

      if (error) throw new Error(error)

      if (data) {
        setManufacturers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        handleChange('manufacturer_id', data.id)
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

  const getSelectedSubCatalog = () => {
    const catalog = getSelectedCatalog()
    return catalog?.subCatalogs.find(sc => sc.code === formData.sub_catalog_code)
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0])
      }
    },
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.sku || !formData.supplier_part_number || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (SKU, Name, Part Number)",
        variant: "destructive"
      })
      return
    }

    if ((formData.unit_price || selectedFile) && !formData.supplier_id) {
       toast({
        title: "Validation Error",
        description: "Please select a supplier when adding price or document",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      let documentId = undefined

      // 1. Upload File if selected
      if (selectedFile) {
        // Get upload URL
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            supplierId: formData.supplier_id,
          }),
        })

        if (!uploadRes.ok) throw new Error('Failed to initiate upload')
        
        const { uploadUrl, documentId: docId } = await uploadRes.json()
        documentId = docId

        // Upload to Storage
        const uploadFileRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: { 'Content-Type': selectedFile.type },
        })

        if (!uploadFileRes.ok) throw new Error('Failed to upload file to storage')
      }

      // 2. Create Part
      const payload: any = {
        sku: formData.sku,
        supplier_part_number: formData.supplier_part_number,
        name: formData.name,
        description: formData.description,
        document_id: documentId,
        catalog_code: formData.catalog_code || null,
        sub_catalog_code: formData.sub_catalog_code || null,
        manufacturer_id: formData.manufacturer_id || null,
        attributes: Object.keys(formData.attributes).length > 0 ? formData.attributes : null,
      }

      if (formData.unit_price && formData.supplier_id) {
        payload.initial_price = {
          unit_price: parseFloat(formData.unit_price),
          currency: formData.currency,
          supplier_id: formData.supplier_id,
        }
      }

      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create part')
      }

      toast({
        title: "Success",
        description: "Part created successfully",
      })

      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        sku: '',
        supplier_part_number: '',
        name: '',
        description: '',
        supplier_id: '',
        manufacturer_id: '',
        unit_price: '',
        currency: 'USD',
        catalog_code: '',
        sub_catalog_code: '',
        attributes: {},
      })
      setSelectedFile(null)
      setShowAddSupplierConfirm(false)
      setIsAddingSupplier(false)
      setNewSupplierName('')
      setShowAddManufacturerConfirm(false)
      setIsAddingManufacturer(false)
      setNewManufacturerName('')

    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create part",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Part</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Part Details */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="Internal SKU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_part_number">Supplier Part Number *</Label>
              <Input
                id="supplier_part_number"
                value={formData.supplier_part_number}
                onChange={(e) => handleChange('supplier_part_number', e.target.value)}
                placeholder="Supplier Part #"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Part Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Part Name"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Part description..."
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              {!isAddingManufacturer ? (
                <Select 
                  value={formData.manufacturer_id} 
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

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Categorization</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="catalog">Catalog</Label>
                <Select 
                  value={formData.catalog_code} 
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
                  value={formData.sub_catalog_code} 
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
                      value={formData.attributes[attr] || ''}
                      onChange={(e) => handleAttributeChange(attr, e.target.value)}
                      placeholder={`Enter ${attr}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Pricing & Document</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                {!isAddingSupplier ? (
                  <Select 
                    value={formData.supplier_id} 
                    onValueChange={(val) => {
                      if (val === 'new-supplier') {
                        setShowAddSupplierConfirm(true)
                      } else {
                        handleChange('supplier_id', val)
                        const supplier = suppliers.find(s => s.id === val)
                        if (supplier) handleChange('currency', supplier.currency)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-supplier" className="text-primary font-medium">
                        <div className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Supplier
                        </div>
                      </SelectItem>
                      {suppliers.length > 0 ? (
                        suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">No suppliers found</div>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      placeholder="New Supplier Name"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleCreateSupplier} disabled={isCreatingSupplier}>
                      {isCreatingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingSupplier(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {showAddSupplierConfirm && !isAddingSupplier && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-md border border-border">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-medium">Are you sure you want to add a new supplier?</p>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => {
                              setShowAddSupplierConfirm(false)
                              setIsAddingSupplier(true)
                            }}
                          >
                            Yes, Add New
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setShowAddSupplierConfirm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Unit Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => handleChange('unit_price', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(val) => handleChange('currency', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Curr" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* File Upload */}
             <div className="space-y-2">
              <Label>Source Document (Quote)</Label>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary",
                  selectedFile ? "bg-muted/30" : ""
                )}
              >
                <input {...getInputProps()} />
                {selectedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Drag & drop quote PDF here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
