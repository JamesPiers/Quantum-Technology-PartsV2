'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
  Trash2
} from 'lucide-react'
import { Part } from '@/lib/types/database.types'
import { usePart, useDeletePart } from '@/lib/hooks/use-parts'
import { PartDetailContent } from '@/components/part-detail-content'
import { useToast } from '@/components/ui/use-toast'

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
  
  // Modal state
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Selection state
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([])

  // Additional filters
  const [skuFilter, setSkuFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [partNumberFilter, setPartNumberFilter] = useState('')
  
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
    queryKey: ['parts', debouncedSearch, page, pageSize, sortField, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      params.append('limit', pageSize.toString())
      params.append('offset', (page * pageSize).toString())

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
  }

  const hasActiveFilters = search || skuFilter || nameFilter || partNumberFilter

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
        </div>

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectedPartIds.length === parts.length && parts.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center font-medium hover:text-foreground"
                          onClick={() => handleSort('sku')}
                        >
                          SKU
                          {getSortIcon('sku')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center font-medium hover:text-foreground"
                          onClick={() => handleSort('supplier_part_number')}
                        >
                          Part Number
                          {getSortIcon('supplier_part_number')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center font-medium hover:text-foreground"
                          onClick={() => handleSort('name')}
                        >
                          Name
                          {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="max-w-md">Description</TableHead>
                      <TableHead>Attributes</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center font-medium hover:text-foreground"
                          onClick={() => handleSort('created_at')}
                        >
                          Created
                          {getSortIcon('created_at')}
                        </button>
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedPartIds.includes(part.id)}
                            onCheckedChange={(checked) => handleSelectOne(part.id, !!checked)}
                            aria-label={`Select part ${part.sku}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{part.sku}</TableCell>
                        <TableCell>{part.supplier_part_number}</TableCell>
                        <TableCell>{part.name}</TableCell>
                        <TableCell>
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
                        <TableCell className="max-w-md">
                          <div className="truncate" title={part.description || ''}>
                            {part.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {part.attributes && Object.keys(part.attributes).length > 0 ? (
                            <div className="text-xs max-w-xs truncate" title={JSON.stringify(part.attributes)}>
                              {Object.entries(part.attributes).map(([key, value]) => (
                                <span key={key} className="inline-block mr-2">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(part.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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
                        id="page-size"
                        value={pageSize.toString()}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value))
                          setPage(0)
                        }}
                        className="w-20"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
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
      </div>
    </div>
  )
}
