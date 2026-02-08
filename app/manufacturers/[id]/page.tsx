'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getManufacturerById } from '@/app/actions/manufacturer'
import { Manufacturer } from '@/lib/types/database.types'
import { HierarchyView } from '@/components/parts/hierarchy-view'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink, Factory } from 'lucide-react'
import Link from 'next/link'

export default function ManufacturerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [manufacturer, setManufacturer] = useState<Manufacturer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchManufacturer = useCallback(async () => {
    try {
      const { data, error } = await getManufacturerById(id)
      if (data) {
        setManufacturer(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchManufacturer()
    }
  }, [id, fetchManufacturer])

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (!manufacturer) {
    return <div className="container mx-auto py-8">Manufacturer not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/manufacturers">
          <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Manufacturers
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Factory className="h-8 w-8 text-muted-foreground" />
            {manufacturer.name}
          </h1>
          {manufacturer.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {manufacturer.description}
            </p>
          )}
        </div>
        {manufacturer.website_url && (
          <a 
            href={manufacturer.website_url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              Visit Website
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        )}
      </div>

      <div className="bg-muted/10 rounded-lg p-1">
        <h2 className="text-xl font-semibold mb-4 px-4 pt-4">Product Catalog</h2>
        <HierarchyView 
          onPartClick={(partId) => router.push(`/parts/${partId}`)} 
          manufacturerId={id}
        />
      </div>
    </div>
  )
}

