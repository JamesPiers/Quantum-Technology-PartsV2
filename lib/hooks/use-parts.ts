/**
 * React hooks for parts data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Part, PartWithDetails } from '@/lib/types/database.types'

export function useParts(search?: string) {
  return useQuery({
    queryKey: ['parts', search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/parts?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch parts')
      return response.json()
    },
  })
}

export function usePart(id: string) {
  return useQuery({
    queryKey: ['part', id],
    queryFn: async () => {
      const response = await fetch(`/api/parts/${id}`)
      if (!response.ok) throw new Error('Failed to fetch part')
      return response.json() as Promise<PartWithDetails>
    },
    enabled: !!id,
  })
}

export function useCreatePart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Part>) => {
      const response = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create part')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
  })
}

export function useUpdatePart(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Part>) => {
      const response = await fetch(`/api/parts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update part')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      queryClient.invalidateQueries({ queryKey: ['part', id] })
    },
  })
}

export function useDeletePart(id?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (targetId?: string) => {
      const finalId = targetId || id
      if (!finalId) throw new Error('No part ID provided')
      
      const response = await fetch(`/api/parts/${finalId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete part')
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      const deletedId = variables || id
      if (deletedId) {
        queryClient.invalidateQueries({ queryKey: ['part', deletedId] })
      }
    },
  })
}

