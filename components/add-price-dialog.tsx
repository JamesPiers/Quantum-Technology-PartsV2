'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  DollarSign,
  Loader2,
  Plus,
  Check,
  X,
  AlertCircle,
  Upload,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { getSuppliers, createSupplier, Supplier } from '@/app/actions/supplier'

interface AddPriceDialogProps {
  partId: string
  partName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPriceAdded: () => void
}

export function AddPriceDialog({
  partId,
  partName,
  open,
  onOpenChange,
  onPriceAdded,
}: AddPriceDialogProps) {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Add Supplier State
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierCurrency, setNewSupplierCurrency] = useState('USD')
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false)

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState({
    supplier_id: '',
    unit_price: '',
    currency: 'USD',
    moq: '',
    lead_time_days: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_through: '',
  })

  useEffect(() => {
    if (open) {
      getSuppliers().then(({ data }) => {
        if (data) setSuppliers(data)
      })
    }
  }, [open])

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      unit_price: '',
      currency: 'USD',
      moq: '',
      lead_time_days: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_through: '',
    })
    setFile(null)
    setIsAddingSupplier(false)
    setNewSupplierName('')
  }

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return
    setIsCreatingSupplier(true)
    try {
      const { data, error } = await createSupplier(newSupplierName.trim(), newSupplierCurrency)
      if (error) throw new Error(error)
      if (data) {
        setSuppliers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        setFormData(prev => ({ ...prev, supplier_id: data.id }))
        setIsAddingSupplier(false)
        setNewSupplierName('')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create supplier',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingSupplier(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.supplier_id || !formData.unit_price) {
      toast({
        title: 'Missing fields',
        description: 'Supplier and unit price are required.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      // Upload document if provided
      let documentId: string | null = null
      if (file) {
        setIsUploading(true)

        // Get upload URL
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            supplierId: formData.supplier_id,
          }),
        })

        if (!uploadRes.ok) throw new Error('Failed to get upload URL')
        const { uploadUrl, documentId: docId } = await uploadRes.json()

        // Upload file to storage
        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!putRes.ok) throw new Error('Failed to upload file')
        documentId = docId
        setIsUploading(false)
      }

      // Create the price record
      const response = await fetch(`/api/parts/${partId}/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: formData.supplier_id,
          unit_price: parseFloat(formData.unit_price),
          currency: formData.currency,
          moq: formData.moq ? parseInt(formData.moq) : null,
          lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : null,
          valid_from: formData.valid_from || undefined,
          valid_through: formData.valid_through || null,
          document_id: documentId,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to add price')
      }

      toast({
        title: 'Price added',
        description: `New price record has been added to ${partName}.`,
      })

      resetForm()
      onOpenChange(false)
      onPriceAdded()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add price',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Add Price for {partName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Supplier */}
          <div className="space-y-2">
            <Label>Supplier <span className="text-destructive">*</span></Label>
            {!isAddingSupplier ? (
              <Select
                value={formData.supplier_id}
                onValueChange={(val) => {
                  if (val === '__new__') {
                    setIsAddingSupplier(true)
                  } else {
                    setFormData({ ...formData, supplier_id: val })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__" className="text-primary font-medium">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Supplier
                    </div>
                  </SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="Supplier name"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleCreateSupplier} disabled={isCreatingSupplier}>
                    {isCreatingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingSupplier(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Price <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(val) => setFormData({ ...formData, currency: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* MOQ & Lead Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Order Quantity</Label>
              <Input
                type="number"
                min="0"
                value={formData.moq}
                onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                placeholder="e.g. 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Time (days)</Label>
              <Input
                type="number"
                min="0"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                placeholder="e.g. 14"
              />
            </div>
          </div>

          {/* Valid Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid From</Label>
              <Input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid Through</Label>
              <Input
                type="date"
                value={formData.valid_through}
                onChange={(e) => setFormData({ ...formData, valid_through: e.target.value })}
              />
            </div>
          </div>

          {/* Supporting Document */}
          <div className="space-y-2">
            <Label>Supporting Document (optional)</Label>
            <p className="text-xs text-muted-foreground">Attach a quote or invoice PDF for reference.</p>
            {file ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                  <Upload className="h-4 w-4" />
                  Click to upload PDF
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false) }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Price
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
