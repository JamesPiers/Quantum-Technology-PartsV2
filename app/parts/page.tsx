'use client'

import { useState, useEffect } from 'react'
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Trash2,
  Plus,
  GripVertical,
  LayoutGrid,
  List,
  Download,
  Upload
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { Part } from '@/lib/types/database.types'
import { usePart, useDeletePart } from '@/lib/hooks/use-parts'
import { PartDetailContent } from '@/components/part-detail-content'
import { useToast } from '@/components/ui/use-toast'
import { AddPartDialog } from '@/components/add-part-dialog'
import { PART_CATALOGS } from '@/lib/constants/part-catalogs'
import { HierarchyView } from '@/components/parts/hierarchy-view'
import { Progress } from '@/components/ui/progress'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type SortField = 'sku' | 'supplier_part_number' | 'name' | 'created_at'
type SortOrder = 'asc' | 'desc'

export default function PartsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('table')
  
  // Modal state
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // Selection state
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([])

  // Additional filters
  const [skuFilter, setSkuFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [partNumberFilter, setPartNumberFilter] = useState('')
  const [catalogFilter, setCatalogFilter] = useState<string>('all')
  const [subCatalogFilter, setSubCatalogFilter] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState({ processed: 0, failed: 0, total: 0 })
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Column resizing
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    select: 48,
    sku: 120,
    partNumber: 140,
    name: 200,
    price: 100,
    catalog: 150,
    subCatalog: 150,
    detail1: 120,
    detail2: 120,
    detail3: 120,
    detail4: 120,
    created: 110,
  })
  const resizingRef = useRef<{ col: string, startX: number, startWidth: number } | null>(null)

  // Fetch selected part details for modal
  const { data: selectedPart, isLoading: isLoadingPart } = usePart(selectedPartId || '')
  
  // Delete mutation
  const { mutateAsync: deletePart } = useDeletePart()

  // Handle part click
  const handlePartClick = (partId: string) => {
    setSelectedPartId(partId)
    setIsModalOpen(true)
    // Update URL without navigation
    window.history.pushState({}, '', `/parts?selected=${partId}`)
  }
  
  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPartId(null)
    // Reset URL
    window.history.pushState({}, '', '/parts')
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0) // Reset to first page on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch parts
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['parts', debouncedSearch, page, pageSize, sortField, sortOrder, catalogFilter, subCatalogFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      params.append('limit', pageSize.toString())
      params.append('offset', (page * pageSize).toString())
      
      if (catalogFilter && catalogFilter !== 'all') {
        params.append('catalog_code', catalogFilter)
      }
      
      if (subCatalogFilter && subCatalogFilter !== 'all') {
        params.append('sub_catalog_code', subCatalogFilter)
      }

      const response = await fetch(`/api/parts?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch parts')
      return response.json()
    },
  })

  const parts = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Reset selection when parts change (e.g. page change)
  useEffect(() => {
    setSelectedPartIds([])
  }, [page, pageSize, debouncedSearch, sortField, sortOrder])

  // Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPartIds(parts.map((p: Part) => p.id))
    } else {
      setSelectedPartIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPartIds(prev => [...prev, id])
    } else {
      setSelectedPartIds(prev => prev.filter(pid => pid !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedPartIds.length} parts?`)) return
    
    const toDelete = [...selectedPartIds]
    
    try {
      await Promise.all(toDelete.map(id => deletePart(id)))
      
      toast({
        title: "Parts deleted",
        description: `Successfully deleted ${toDelete.length} parts.`,
      })
      
      setSelectedPartIds([])
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some parts.",
        variant: "destructive"
      })
    }
  }

  // Client-side filtering for additional filters
  const filteredParts = parts.filter((part: Part) => {
    if (skuFilter && !part.sku.toLowerCase().includes(skuFilter.toLowerCase())) {
      return false
    }
    if (nameFilter && !part.name.toLowerCase().includes(nameFilter.toLowerCase())) {
      return false
    }
    if (partNumberFilter && !part.supplier_part_number.toLowerCase().includes(partNumberFilter.toLowerCase())) {
      return false
    }
    return true
  })

  // Client-side sorting
  const sortedParts = [...filteredParts].sort((a: Part, b: Part) => {
    const aVal = a[sortField as keyof Part]
    const bVal = b[sortField as keyof Part]
    
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSkuFilter('')
    setNameFilter('')
    setPartNumberFilter('')
    setCatalogFilter('all')
    setSubCatalogFilter('all')
  }

  const hasActiveFilters = search || skuFilter || nameFilter || partNumberFilter || (catalogFilter && catalogFilter !== 'all') || (subCatalogFilter && subCatalogFilter !== 'all')

  const getCatalogName = (code: string | null | undefined) => {
    if (!code) return '-'
    const catalog = PART_CATALOGS.find(c => c.code === code)
    return catalog ? catalog.name : code
  }

  const getSubCatalogName = (catalogCode: string | null | undefined, subCode: string | null | undefined) => {
    if (!catalogCode || !subCode) return '-'
    const catalog = PART_CATALOGS.find(c => c.code === catalogCode)
    if (!catalog) return subCode
    const sub = catalog.subCatalogs.find(s => s.code === subCode)
    return sub ? sub.name : subCode
  }

  const getDetailValue = (part: Part, index: number) => {
    if (!part.catalog_code || !part.attributes) return '-'
    const catalog = PART_CATALOGS.find(c => c.code === part.catalog_code)
    if (!catalog || !catalog.details || catalog.details.length <= index) return '-'
    
    const key = catalog.details[index]
    const val = part.attributes[key]
    return val !== undefined && val !== null ? String(val) : '-'
  }

  // Get current catalog details for headers
  const activeCatalog = PART_CATALOGS.find(c => c.code === catalogFilter)
  const detailHeaders = activeCatalog?.details || []

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      params.append('all', 'true')
      
      if (catalogFilter && catalogFilter !== 'all') {
        params.append('catalog_code', catalogFilter)
      }
      
      if (subCatalogFilter && subCatalogFilter !== 'all') {
        params.append('sub_catalog_code', subCatalogFilter)
      }

      const response = await fetch(`/api/parts?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch parts for export')
      const { data } = await response.json()
      
      // Apply client-side filters
      const exportedParts = data.filter((part: Part) => {
        if (skuFilter && !part.sku.toLowerCase().includes(skuFilter.toLowerCase())) return false
        if (nameFilter && !part.name.toLowerCase().includes(nameFilter.toLowerCase())) return false
        if (partNumberFilter && !part.supplier_part_number.toLowerCase().includes(partNumberFilter.toLowerCase())) return false
        return true
      })

      // 1. Identify all unique attribute keys across all parts
      const allAttributeKeys = new Set<string>()
      exportedParts.forEach((part: Part) => {
        if (part.attributes) {
          Object.keys(part.attributes).forEach(key => allAttributeKeys.add(key))
        }
      })
      const sortedAttributeKeys = Array.from(allAttributeKeys).sort()

      // 2. Flatten data
      const flattenPart = (part: any) => {
        const flat: any = {
          id: part.id,
          sku: part.sku,
          supplier_part_number: part.supplier_part_number,
          name: part.name,
          description: part.description,
          manufacturer_id: part.manufacturer_id,
          catalog_code: part.catalog_code,
          sub_catalog_code: part.sub_catalog_code,
          drawing_url: part.drawing_url,
          created_at: part.created_at,
          // Price info
          unit_price: part.current_price?.unit_price,
          currency: part.current_price?.currency,
          supplier_id: part.current_price?.supplier_id,
          moq: part.current_price?.moq,
          lead_time_days: part.current_price?.lead_time_days,
        }

        // Add attributes as top-level columns
        sortedAttributeKeys.forEach(key => {
            if (part.attributes && part.attributes[key] !== undefined) {
                flat[key] = part.attributes[key]
            }
        })
        
        return flat
      }

      const rows = exportedParts.map(flattenPart)
      
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Parts")
      XLSX.writeFile(wb, "parts_export.xlsx")
      
      toast({
        title: "Export Successful",
        description: `Exported ${rows.length} parts.`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Could not export parts.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setShowProgressDialog(true)
    setImportProgress(0)
    setImportStats({ processed: 0, failed: 0, total: 0 })

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // Transform flat JSON back to structured Part objects
      // We need to identify which fields are standard and which are attributes
      const standardFields = new Set([
        'id', 'sku', 'supplier_part_number', 'name', 'description', 
        'manufacturer_id', 'catalog_code', 'sub_catalog_code', 'drawing_url', 'created_at',
        'unit_price', 'currency', 'supplier_id', 'moq', 'lead_time_days', 'attributes' // attributes might be there if manually added, but we construct it
      ])

      const processedData = jsonData.map((row: any) => {
        const part: any = { ...row }
        const attributes: Record<string, any> = {}
        
        // If there's an existing attributes JSON string (legacy or manual), parse it
        if (row.attributes) {
            try {
                const parsed = typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes
                Object.assign(attributes, parsed)
            } catch (e) {
                // ignore
            }
        }

        // Move non-standard fields to attributes
        Object.keys(row).forEach(key => {
            if (!standardFields.has(key)) {
                attributes[key] = row[key]
                delete part[key] // Remove from top level to avoid cluttering or errors if API is strict (API handles it though)
            }
        })

        part.attributes = attributes
        return part
      })

      const totalRows = processedData.length
      setImportStats(prev => ({ ...prev, total: totalRows }))

      const CHUNK_SIZE = 10
      const chunks = []
      for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
        chunks.push(processedData.slice(i, i + CHUNK_SIZE))
      }

      let processedCount = 0
      let failedCount = 0
      const allErrors: any[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        
        try {
          const response = await fetch('/api/parts/batch-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parts: chunk })
          })

          if (!response.ok) {
            const resData = await response.json()
            throw new Error(resData.error || 'Failed to import chunk')
          }

          const result = await response.json()
          
          processedCount += result.count || 0
          if (result.errors) {
            failedCount += result.errors.length
            allErrors.push(...result.errors)
          }
        } catch (err) {
          console.error(`Error processing chunk ${i}:`, err)
          failedCount += chunk.length // Assuming entire chunk failed if request failed
        }

        const currentProgress = Math.round(((i + 1) / chunks.length) * 100)
        setImportProgress(currentProgress)
        setImportStats(prev => ({ 
          ...prev, 
          processed: processedCount, 
          failed: failedCount 
        }))
      }
      
      // Delay closing dialog slightly to show 100%
      await new Promise(resolve => setTimeout(resolve, 500))
      setShowProgressDialog(false)

      if (allErrors.length > 0 || failedCount > 0) {
        toast({
            title: "Import Completed with Errors",
            description: `Processed: ${processedCount}. Failed: ${failedCount}. Check console for details.`,
            variant: "destructive"
        })
        console.warn('Import errors:', allErrors)
      } else {
          toast({
            title: "Import Successful",
            description: `Successfully processed ${processedCount} parts.`
          })
      }
      refetch()
    } catch (error) {
      console.error('Import error:', error)
      setShowProgressDialog(false)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Could not import parts.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Resizing Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const { col, startX, startWidth } = resizingRef.current
      const diff = e.clientX - startX
      const newWidth = Math.max(50, startWidth + diff)
      setColWidths(prev => ({ ...prev, [col]: newWidth }))
    }

    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const startResize = (e: React.MouseEvent, col: string) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current = {
      col,
      startX: e.clientX,
      startWidth: colWidths[col] || 100
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const ResizeHandle = ({ col }: { col: string }) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-primary/10 flex items-center justify-center group"
      onMouseDown={(e) => startResize(e, col)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[1px] h-4 bg-border group-hover:bg-primary/50" />
    </div>
  )

  const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Parts Catalog</h1>
            <p className="text-muted-foreground">
              Browse and search your parts inventory
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedPartIds.length > 0 && (
              <div className="flex items-center gap-2 bg-muted p-2 rounded-lg animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium px-2">
                  {selectedPartIds.length} selected
                </span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            )}
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Part
            </Button>
            
            <div className="h-6 w-px bg-border mx-2" />
            
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>

            <Button
              variant="outline"
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-6 border-b">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            onClick={() => setViewMode('table')}
            className="rounded-b-none rounded-t-md"
          >
            <List className="mr-2 h-4 w-4" />
            Table View
          </Button>
          <Button
            variant={viewMode === 'hierarchy' ? 'default' : 'ghost'}
            onClick={() => setViewMode('hierarchy')}
            className="rounded-b-none rounded-t-md"
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Hierarchy View
          </Button>
        </div>

        {viewMode === 'table' ? (
          <>
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Main Search */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search all fields..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Catalog</Label>
                        <Select 
                          value={catalogFilter} 
                          onValueChange={(val) => {
                            setCatalogFilter(val)
                            setSubCatalogFilter('all') // Reset sub-catalog when catalog changes
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Catalogs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Catalogs</SelectItem>
                            {PART_CATALOGS.map((catalog) => (
                              <SelectItem key={catalog.code} value={catalog.code}>
                                {catalog.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Sub-Catalog</Label>
                        <Select 
                          value={subCatalogFilter} 
                          onValueChange={setSubCatalogFilter}
                          disabled={!catalogFilter || catalogFilter === 'all'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Sub-Catalogs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sub-Catalogs</SelectItem>
                            {catalogFilter && catalogFilter !== 'all' && PART_CATALOGS
                              .find(c => c.code === catalogFilter)
                              ?.subCatalogs.map((sub) => (
                                <SelectItem key={sub.code} value={sub.code}>
                                  {sub.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku-filter">SKU</Label>
                        <Input
                          id="sku-filter"
                          placeholder="Filter by SKU..."
                          value={skuFilter}
                          onChange={(e) => setSkuFilter(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name-filter">Part Name</Label>
                        <Input
                          id="name-filter"
                          placeholder="Filter by name..."
                          value={nameFilter}
                          onChange={(e) => setNameFilter(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnum-filter">Part Number</Label>
                        <Input
                          id="partnum-filter"
                          placeholder="Filter by part number..."
                          value={partNumberFilter}
                          onChange={(e) => setPartNumberFilter(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : sortedParts.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No parts found
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto border rounded-md">
                      <Table style={{ width: Math.max(totalWidth, 1000), minWidth: '100%', tableLayout: 'fixed' }}>
                        <TableHeader>
                          <TableRow>
                            <TableHead style={{ width: colWidths.select }} className="relative">
                              <Checkbox 
                                checked={selectedPartIds.length === parts.length && parts.length > 0}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                aria-label="Select all"
                              />
                              <ResizeHandle col="select" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.sku }} className="relative">
                              <button
                                className="flex items-center font-medium hover:text-foreground w-full"
                                onClick={() => handleSort('sku')}
                              >
                                SKU
                                {getSortIcon('sku')}
                              </button>
                              <ResizeHandle col="sku" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.partNumber }} className="relative">
                              <button
                                className="flex items-center font-medium hover:text-foreground w-full"
                                onClick={() => handleSort('supplier_part_number')}
                              >
                                Part Number
                                {getSortIcon('supplier_part_number')}
                              </button>
                              <ResizeHandle col="partNumber" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.name }} className="relative">
                              <button
                                className="flex items-center font-medium hover:text-foreground w-full"
                                onClick={() => handleSort('name')}
                              >
                                Name
                                {getSortIcon('name')}
                              </button>
                              <ResizeHandle col="name" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.price }} className="relative">
                              Price
                              <ResizeHandle col="price" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.catalog }} className="relative">
                              Catalog
                              <ResizeHandle col="catalog" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.subCatalog }} className="relative">
                              Sub-Catalog
                              <ResizeHandle col="subCatalog" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.detail1 }} className="relative">
                              <span title={detailHeaders[0] || 'Detail 1'}>{detailHeaders[0] || 'Detail 1'}</span>
                              <ResizeHandle col="detail1" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.detail2 }} className="relative">
                              <span title={detailHeaders[1] || 'Detail 2'}>{detailHeaders[1] || 'Detail 2'}</span>
                              <ResizeHandle col="detail2" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.detail3 }} className="relative">
                              <span title={detailHeaders[2] || 'Detail 3'}>{detailHeaders[2] || 'Detail 3'}</span>
                              <ResizeHandle col="detail3" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.detail4 }} className="relative">
                              <span title={detailHeaders[3] || 'Detail 4'}>{detailHeaders[3] || 'Detail 4'}</span>
                              <ResizeHandle col="detail4" />
                            </TableHead>
                            <TableHead style={{ width: colWidths.created }} className="relative">
                              <button
                                className="flex items-center font-medium hover:text-foreground w-full"
                                onClick={() => handleSort('created_at')}
                              >
                                Created
                                {getSortIcon('created_at')}
                              </button>
                              <ResizeHandle col="created" />
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedParts.map((part: Part) => (
                            <TableRow 
                              key={part.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handlePartClick(part.id)}
                              data-state={selectedPartIds.includes(part.id) ? "selected" : undefined}
                            >
                              <TableCell style={{ width: colWidths.select }} onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                  checked={selectedPartIds.includes(part.id)}
                                  onCheckedChange={(checked) => handleSelectOne(part.id, !!checked)}
                                  aria-label={`Select part ${part.sku}`}
                                />
                              </TableCell>
                              <TableCell style={{ width: colWidths.sku }} className="font-medium truncate">{part.sku}</TableCell>
                              <TableCell style={{ width: colWidths.partNumber }} className="truncate">{part.supplier_part_number}</TableCell>
                              <TableCell style={{ width: colWidths.name }} className="truncate" title={part.name}>{part.name}</TableCell>
                              <TableCell style={{ width: colWidths.price }}>
                                {part.current_price ? (
                                  <span className="font-medium">
                                    {part.current_price.unit_price.toLocaleString(undefined, {
                                      style: 'currency',
                                      currency: part.current_price.currency
                                    })}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell style={{ width: colWidths.catalog }} className="text-sm truncate" title={getCatalogName(part.catalog_code)}>{getCatalogName(part.catalog_code)}</TableCell>
                              <TableCell style={{ width: colWidths.subCatalog }} className="text-sm truncate" title={getSubCatalogName(part.catalog_code, part.sub_catalog_code)}>{getSubCatalogName(part.catalog_code, part.sub_catalog_code)}</TableCell>
                              <TableCell style={{ width: colWidths.detail1 }} className="text-sm truncate" title={`${detailHeaders[0] || 'Detail 1'}: ${getDetailValue(part, 0)}`}>{getDetailValue(part, 0)}</TableCell>
                              <TableCell style={{ width: colWidths.detail2 }} className="text-sm truncate" title={`${detailHeaders[1] || 'Detail 2'}: ${getDetailValue(part, 1)}`}>{getDetailValue(part, 1)}</TableCell>
                              <TableCell style={{ width: colWidths.detail3 }} className="text-sm truncate" title={`${detailHeaders[2] || 'Detail 3'}: ${getDetailValue(part, 2)}`}>{getDetailValue(part, 2)}</TableCell>
                              <TableCell style={{ width: colWidths.detail4 }} className="text-sm truncate" title={`${detailHeaders[3] || 'Detail 4'}: ${getDetailValue(part, 3)}`}>{getDetailValue(part, 3)}</TableCell>
                              <TableCell style={{ width: colWidths.created }} className="text-sm text-muted-foreground truncate">
                                {new Date(part.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} parts
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="page-size" className="text-sm">
                            Per page:
                          </Label>
                          <Select
                            value={pageSize.toString()}
                            onValueChange={(val) => {
                              setPageSize(Number(val))
                              setPage(0)
                            }}
                          >
                            <SelectTrigger id="page-size" className="w-20">
                              <SelectValue placeholder={pageSize.toString()} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(0)}
                          disabled={page === 0}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm">
                          Page {page + 1} of {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page >= totalPages - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(totalPages - 1)}
                          disabled={page >= totalPages - 1}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <HierarchyView onPartClick={handlePartClick} />
        )}

        {/* Part Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
            {isLoadingPart ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedPart ? (
              <PartDetailContent part={selectedPart} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Part not found
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Part Dialog */}
        <AddPartDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen} 
          onSuccess={() => refetch()} 
        />

        {/* Import Progress Dialog */}
        <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Importing Parts...</DialogTitle>
              <DialogDescription>
                Please wait while we process your Excel file. Do not close this window.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Progress value={importProgress} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress: {importProgress}%</span>
                <span>
                  {importStats.processed + importStats.failed} / {importStats.total} processed
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                 <div>Success: {importStats.processed}</div>
                 {importStats.failed > 0 && <div className="text-destructive">Failed: {importStats.failed}</div>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
