'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus } from 'lucide-react'
import Link from 'next/link'

export default function OrdersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [customerName, setCustomerName] = useState('')

  // Fetch orders
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quote',
          customer_name: customerName || undefined,
          currency: 'USD',
        }),
      })
      if (!response.ok) throw new Error('Failed to create order')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Success',
        description: 'Order created successfully',
      })
      setCustomerName('')
      setIsCreatingOrder(false)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create order',
        variant: 'destructive',
      })
    },
  })

  const handleCreateOrder = () => {
    createOrderMutation.mutate()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Orders</h1>
            <p className="text-muted-foreground">
              Manage customer quotes and purchase orders
            </p>
          </div>
          <Button onClick={() => setIsCreatingOrder(!isCreatingOrder)}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>

        {isCreatingOrder && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleCreateOrder}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Order'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingOrder(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {data?.data?.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {order.customer_name || 'Unnamed Order'}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        Type: {order.type} | Status: {order.status} | Currency: {order.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {data?.data?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No orders found</p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreatingOrder(true)}
                  >
                    Create Your First Order
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

