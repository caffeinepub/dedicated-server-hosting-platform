import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCart,
  useRemoveFromCart,
  useCheckout,
  useGetUserOrders,
  useGetUserInvoices,
  useIsCallerAdmin,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ShoppingCart, Trash2, Package, FileText, CreditCard } from 'lucide-react';
import InvitationCodeRedemption from '../components/InvitationCodeRedemption';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { data: cart, isLoading: cartLoading } = useGetCart();
  const { data: orders, isLoading: ordersLoading } = useGetUserOrders();
  const { data: invoices, isLoading: invoicesLoading } = useGetUserInvoices();
  const { data: isAdmin } = useIsCallerAdmin();
  const removeFromCart = useRemoveFromCart();
  const checkout = useCheckout();
  const [checkingOut, setCheckingOut] = useState(false);
  const [redemptionOpen, setRedemptionOpen] = useState(false);

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

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setCheckingOut(true);
    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;

      const session = await checkout.mutateAsync({ successUrl, cancelUrl });
      
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      window.location.href = session.url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate checkout');
      setCheckingOut(false);
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
          <p className="text-muted-foreground mt-2">Manage your orders, cart, and invoices.</p>
        </div>

        {!isAdmin && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Become an Admin
              </CardTitle>
              <CardDescription>
                Have an admin invitation code? Redeem it here to gain admin privileges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setRedemptionOpen(true)}>
                Redeem Admin Code
              </Button>
            </CardContent>
          </Card>
        )}

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
                <CardDescription>Review your items before checkout.</CardDescription>
              </CardHeader>
              <CardContent>
                {cartLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : cart && cart.items.length > 0 ? (
                  <div className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan</TableHead>
                          <TableHead>Specs</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.cpu} • {item.ram} • {item.storage}
                            </TableCell>
                            <TableCell>{formatPrice(item.pricePerMonth, item.currency)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="text-2xl font-bold">
                          {formatPrice(cart.total, cart.currency)}
                        </div>
                      </div>
                      <Button size="lg" onClick={handleCheckout} disabled={checkingOut}>
                        {checkingOut ? (
                          'Processing...'
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Proceed to Checkout
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Your cart is empty</p>
                    <Button onClick={() => navigate({ to: '/plans' })}>
                      Browse Server Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View your past orders and their status.</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : orders && orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
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
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No orders yet. Start by browsing our server plans.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>View and download your invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : invoices && invoices.length > 0 ? (
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
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(invoice.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No invoices yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <InvitationCodeRedemption open={redemptionOpen} onOpenChange={setRedemptionOpen} />
    </div>
  );
}
