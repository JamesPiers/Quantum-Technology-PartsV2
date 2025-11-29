'use server'

import { supabaseAdmin } from '@/lib/supabase/client'

export interface Supplier {
  id: string
  name: string
  currency: string
}

export async function getSuppliers(): Promise<{ data: Supplier[] | null, error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('id, name, currency')
      .order('name')
    
    if (error) {
      console.error('Error fetching suppliers:', error)
      return { data: null, error: error.message }
    }
    
    return { data: data as Supplier[], error: null }
  } catch (err) {
    console.error('Error in getSuppliers:', err)
    return { data: null, error: 'Failed to fetch suppliers' }
  }
}

export async function createSupplier(name: string, currency: string = 'USD'): Promise<{ data: Supplier | null, error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert({
        name: name,
        currency: currency,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating supplier:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Supplier, error: null }
  } catch (err) {
    console.error('Error in createSupplier:', err)
    return { data: null, error: 'Failed to create supplier' }
  }
}

