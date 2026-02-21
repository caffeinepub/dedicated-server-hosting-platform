import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCart, useRemoveFromCart, useClearCart, useCheckout, useGetUserOrders, useGetUserInvoices } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ShoppingCart, Trash2, CreditCard, Package, FileText } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function DashboardPage() {
  const { identity, login } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useGetCart();
  const { data: orders, isLoading: ordersLoading } = useGetUserOrders();
  const { data: invoices, isLoading: invoicesLoading } = useGetUserInvoices();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();
  const checkout = useCheckout();

  if (!identity) {
    return (
      <div className="container py-12">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-6">Please login to access your dashboard.</p>
          <Button onClick={login}>Login</Button>
        </Card>
      </div>
    );
  }

  const handleRemoveFromCart = async (planId: string) => {
    try {
      await removeFromCart.mutateAsync(planId);
      toast.success('Item removed from cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart.mutateAsync();
      toast.success('Cart cleared');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear cart');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const session = await checkout.mutateAsync({
        successUrl: `${baseUrl}/payment-success`,
        cancelUrl: `${baseUrl}/payment-failure`,
      });
      window.location.href = session.url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate checkout');
    }
  };

  const formatPrice = (price: bigint, currency: string) => {
    const amount = Number(price) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your servers, orders, and billing.</p>
        </div>

        <Tabs defaultValue="cart" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cart">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Shopping Cart
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="mr-2 h-4 w-4" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shopping Cart</CardTitle>
                <CardDescription>Review your selected server plans before checkout.</CardDescription>
              </CardHeader>
              <CardContent>
                {cartLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : !cart || cart.items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                    <Button className="mt-4" onClick={() => navigate({ to: '/plans' })}>
                      Browse Plans
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.cpu} • {item.ram} • {item.storage}
                            </p>
                            <p className="text-sm font-medium">
                              {formatPrice(item.pricePerMonth, item.currency)}/month
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFromCart(item.id)}
                            disabled={removeFromCart.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{formatPrice(cart.total, cart.currency)}/month</span>
                      </div>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          onClick={handleClearCart}
                          disabled={clearCart.isPending}
                          className="flex-1"
                        >
                          Clear Cart
                        </Button>
                        <Button
                          onClick={handleCheckout}
                          disabled={checkout.isPending}
                          className="flex-1"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {checkout.isPending ? 'Processing...' : 'Proceed to Checkout'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View all your server orders and their status.</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <Skeleton className="h-64" />
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Server Plan</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id}</TableCell>
                          <TableCell>{order.serverPlan.name}</TableCell>
                          <TableCell>{formatPrice(order.price, order.currency)}</TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>View and download your billing invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <Skeleton className="h-64" />
                ) : !invoices || invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No invoices yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                          <TableCell className="font-mono text-sm">{invoice.orderId}</TableCell>
                          <TableCell>{formatPrice(invoice.amount, invoice.currency)}</TableCell>
                          <TableCell>
                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
