'use client'

import { useState } from 'react'
import { PART_CATALOGS, PartCatalog, SubCatalog } from '@/lib/constants/part-catalogs'
import { Part } from '@/lib/types/database.types'
import { ChevronRight, ChevronDown, Folder, Box, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils/cn'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface HierarchyViewProps {
  onPartClick: (partId: string) => void
}

interface CountsData {
  catalogCounts: Record<string, number>;
  subCatalogCounts: Record<string, number>;
}

export function HierarchyView({ onPartClick }: HierarchyViewProps) {
  const { data: counts, isLoading } = useQuery<CountsData>({
    queryKey: ['part-counts'],
    queryFn: async () => {
      const res = await fetch('/api/parts/counts');
      if (!res.ok) throw new Error('Failed to fetch counts');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading hierarchy...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {PART_CATALOGS.map((catalog) => (
        <CatalogNode 
          key={catalog.code} 
          catalog={catalog} 
          onPartClick={onPartClick}
          counts={counts}
        />
      ))}
    </div>
  )
}

function CatalogNode({ 
  catalog, 
  onPartClick,
  counts
}: { 
  catalog: PartCatalog
  onPartClick: (partId: string) => void
  counts?: CountsData
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasSubCatalogs = catalog.subCatalogs.length > 0
  
  const count = counts?.catalogCounts[catalog.code] || 0;

  return (
    <div className="border rounded-md bg-card">
      <div 
        className={cn(
          "flex items-center p-3 cursor-pointer hover:bg-accent/50 transition-colors",
          isExpanded && "bg-accent/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="mr-2 text-muted-foreground">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <Folder className="h-4 w-4 mr-2 text-blue-500" />
        <span className="font-medium">{catalog.name}</span>
        <span className="ml-2 text-sm text-muted-foreground">
          ({count})
        </span>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {catalog.code}
        </span>
      </div>

      {isExpanded && (
        <div className="pl-6 pr-2 pb-2">
          {hasSubCatalogs ? (
            <div className="space-y-2 mt-2">
              {catalog.subCatalogs.map((sub) => (
                <SubCatalogNode 
                  key={sub.code} 
                  catalog={catalog}
                  subCatalog={sub} 
                  onPartClick={onPartClick}
                  counts={counts}
                />
              ))}
            </div>
          ) : (
            <div className="mt-2 border-l-2 border-muted pl-4">
              <PartsList 
                catalogCode={catalog.code} 
                onPartClick={onPartClick}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SubCatalogNode({ 
  catalog,
  subCatalog, 
  onPartClick,
  counts
}: { 
  catalog: PartCatalog
  subCatalog: SubCatalog
  onPartClick: (partId: string) => void
  counts?: CountsData
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const countKey = `${catalog.code}:${subCatalog.code}`;
  const count = counts?.subCatalogCounts[countKey] || 0;

  return (
    <div className="border rounded-md bg-background/50">
      <div 
        className={cn(
          "flex items-center p-2 cursor-pointer hover:bg-accent/50 transition-colors",
          isExpanded && "bg-accent/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="mr-2 text-muted-foreground">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <Box className="h-4 w-4 mr-2 text-orange-500" />
        <span className="font-medium text-sm">{subCatalog.name}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          ({count})
        </span>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {subCatalog.code}
        </span>
      </div>

      {isExpanded && (
        <div className="pl-6 pr-2 pb-2">
           <div className="mt-2 border-l-2 border-muted pl-4">
            <PartsList 
              catalogCode={catalog.code} 
              subCatalogCode={subCatalog.code} 
              onPartClick={onPartClick}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PartsList({ 
  catalogCode, 
  subCatalogCode,
  onPartClick 
}: { 
  catalogCode: string
  subCatalogCode?: string
  onPartClick: (partId: string) => void
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parts', 'hierarchy', catalogCode, subCatalogCode],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('catalog_code', catalogCode)
      if (subCatalogCode) {
        params.append('sub_catalog_code', subCatalogCode)
      }
      params.append('limit', '100') // Reasonable limit for category view

      const response = await fetch(`/api/parts?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch parts')
      return response.json()
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading parts...
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-2 text-sm text-destructive">
        Failed to load parts
      </div>
    )
  }

  const parts: Part[] = data?.data || []

  if (parts.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground italic">
        No parts found in this category.
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[150px]">SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[150px]">Part Number</TableHead>
            <TableHead className="w-[100px] text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow 
              key={part.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onPartClick(part.id)}
            >
              <TableCell className="font-medium text-xs">{part.sku}</TableCell>
              <TableCell className="text-xs">{part.name}</TableCell>
              <TableCell className="text-xs">{part.supplier_part_number}</TableCell>
              <TableCell className="text-right text-xs">
                {part.current_price ? (
                  <span>
                    {part.current_price.unit_price.toLocaleString(undefined, {
                      style: 'currency',
                      currency: part.current_price.currency
                    })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data?.count > 100 && (
        <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20">
          Showing first 100 parts. Use table view for full list.
        </div>
      )}
    </div>
  )
}
