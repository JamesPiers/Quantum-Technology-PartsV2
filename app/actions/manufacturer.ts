'use server'

import { supabaseAdmin } from '@/lib/supabase/client'
import { Manufacturer } from '@/lib/types/database.types'

export async function getManufacturers(): Promise<{ data: Manufacturer[] | null, error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('manufacturers')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching manufacturers:', error)
      return { data: null, error: error.message }
    }
    
    return { data: data as Manufacturer[], error: null }
  } catch (err) {
    console.error('Error in getManufacturers:', err)
    return { data: null, error: 'Failed to fetch manufacturers' }
  }
}

export async function getManufacturerById(id: string): Promise<{ data: Manufacturer | null, error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('manufacturers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching manufacturer:', error)
      return { data: null, error: error.message }
    }
    
    return { data: data as Manufacturer, error: null }
  } catch (err) {
    console.error('Error in getManufacturerById:', err)
    return { data: null, error: 'Failed to fetch manufacturer' }
  }
}

export async function createManufacturer(name: string, description?: string, website_url?: string): Promise<{ data: Manufacturer | null, error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('manufacturers')
      .insert({
        name,
        description,
        website_url
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating manufacturer:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Manufacturer, error: null }
  } catch (err) {
    console.error('Error in createManufacturer:', err)
    return { data: null, error: 'Failed to create manufacturer' }
  }
}
