'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({
    part_id: '',
    supplier_id: '',
    quantity: '',
    unit_price: '',
  })

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            parts (*),
            suppliers:supplier_id (*)
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      return data
    },
  })

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/order-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: params.id,
          part_id: newItem.part_id,
          supplier_id: newItem.supplier_id,
          quantity: parseFloat(newItem.quantity),
          unit_price: parseFloat(newItem.unit_price),
          currency: order?.currency || 'USD',
        }),
      })
      if (!response.ok) throw new Error('Failed to add item')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', params.id] })
      toast({
        title: 'Success',
        description: 'Item added to order',
      })
      setIsAddingItem(false)
      setNewItem({
        part_id: '',
        supplier_id: '',
        quantity: '',
        unit_price: '',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add item',
        variant: 'destructive',
      })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/order-items/${itemId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete item')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', params.id] })
      toast({
        title: 'Success',
        description: 'Item removed from order',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete item',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const items = order.order_items || []
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.unit_price,
    0
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {order.customer_name || 'Order Details'}
          </h1>
          <p className="text-muted-foreground">
            Type: {order.type} | Status: {order.status} | Currency: {order.currency}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Items</CardTitle>
                <Button
                  onClick={() => setIsAddingItem(!isAddingItem)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isAddingItem && (
                <Card className="mb-4">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="part_id">Part ID</Label>
                        <Input
                          id="part_id"
                          placeholder="UUID"
                          value={newItem.part_id}
                          onChange={(e) =>
                            setNewItem({ ...newItem, part_id: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplier_id">Supplier ID</Label>
                        <Input
                          id="supplier_id"
                          placeholder="UUID"
                          value={newItem.supplier_id}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              supplier_id: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder="0"
                          value={newItem.quantity}
                          onChange={(e) =>
                            setNewItem({ ...newItem, quantity: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit_price">Unit Price</Label>
                        <Input
                          id="unit_price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newItem.unit_price}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              unit_price: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => addItemMutation.mutate()}
                        disabled={addItemMutation.isPending}
                      >
                        {addItemMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Item'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingItem(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items in this order
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.parts?.name || 'Unknown Part'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {item.parts?.sku || 'N/A'} | Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-medium">
                          {order.currency} {item.unit_price.toFixed(2)} × {item.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: {order.currency}{' '}
                          {(item.unit_price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        disabled={deleteItemMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Subtotal</span>
                    <span>
                      {order.currency} {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

