'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'

export default function PartsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  })

  // Fetch parts
  const { data, isLoading } = useQuery({
    queryKey: ['parts', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)

      const response = await fetch(`/api/parts?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch parts')
      return response.json()
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Parts Catalog</h1>
          <p className="text-muted-foreground">
            Browse and search your parts inventory
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, part number, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {data?.data?.map((part: any) => (
              <Card key={part.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{part.name}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        SKU: {part.sku} | Part #: {part.supplier_part_number}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {part.description && (
                    <p className="text-sm mb-4">{part.description}</p>
                  )}
                  {part.attributes && Object.keys(part.attributes).length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Attributes: </span>
                      <span className="text-muted-foreground">
                        {JSON.stringify(part.attributes)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {data?.data?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No parts found</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {data?.count && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {data.data.length} of {data.count} parts
          </div>
        )}
      </div>
    </div>
  )
}

