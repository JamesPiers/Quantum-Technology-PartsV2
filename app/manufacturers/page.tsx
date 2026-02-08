'use client'

import { useState, useEffect, useCallback } from 'react'
import { getManufacturers } from '@/app/actions/manufacturer'
import { Manufacturer } from '@/lib/types/database.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Search, Factory } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchManufacturers = useCallback(async () => {
    try {
      const { data, error } = await getManufacturers()
      if (error) {
        toast({
          title: "Error fetching manufacturers",
          description: error,
          variant: "destructive"
        })
      }
      if (data) {
        setManufacturers(data)
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to fetch manufacturers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchManufacturers()
  }, [fetchManufacturers])

  const filteredManufacturers = manufacturers.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manufacturers</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view parts by manufacturer
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search manufacturers..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredManufacturers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManufacturers.map((manufacturer) => (
            <Link key={manufacturer.id} href={`/manufacturers/${manufacturer.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-muted-foreground" />
                    {manufacturer.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3">
                    {manufacturer.description || "No description available"}
                  </CardDescription>
                  {manufacturer.website_url && (
                    <div className="mt-4 text-sm text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
                      <a href={manufacturer.website_url} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No manufacturers found matching your search.
        </div>
      )}
    </div>
  )
}

