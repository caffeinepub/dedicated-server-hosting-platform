import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useIsCallerAdmin,
  useGetServerPlans,
  useAddServerPlan,
  useUpdateServerPlan,
  useRemoveServerPlan,
  useGetAllOrders,
  useGetAllUsers,
  useIsStripeConfigured,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Server, Users, Package, Settings } from 'lucide-react';
import type { ServerPlan } from '../backend';
import StripeSetupModal from '../components/StripeSetupModal';

export default function AdminPage() {
  const { identity, login } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading, isFetched: adminFetched } = useIsCallerAdmin();
  const { data: plans, isLoading: plansLoading } = useGetServerPlans();
  const { data: orders, isLoading: ordersLoading } = useGetAllOrders();
  const { data: users, isLoading: usersLoading } = useGetAllUsers();
  const { data: stripeConfigured } = useIsStripeConfigured();
  const addPlan = useAddServerPlan();
  const updatePlan = useUpdateServerPlan();
  const removePlan = useRemoveServerPlan();

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServerPlan | null>(null);
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    cpu: '',
    ram: '',
    storage: '',
    bandwidth: '',
    location: '',
    pricePerMonth: '',
    currency: 'usd',
    available: true,
  });

  useEffect(() => {
    if (editingPlan) {
      setFormData({
        name: editingPlan.name,
        cpu: editingPlan.cpu,
        ram: editingPlan.ram,
        storage: editingPlan.storage,
        bandwidth: editingPlan.bandwidth,
        location: editingPlan.location,
        pricePerMonth: (Number(editingPlan.pricePerMonth) / 100).toString(),
        currency: editingPlan.currency,
        available: editingPlan.available,
      });
      setPlanDialogOpen(true);
    }
  }, [editingPlan]);

  if (!identity) {
    return (
      <div className="container py-12">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-6">Please login to access the admin panel.</p>
          <Button onClick={login}>Login</Button>
        </Card>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (adminFetched && !isAdmin) {
    return (
      <div className="container py-12">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceInCents = BigInt(Math.round(parseFloat(formData.pricePerMonth) * 100));

    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({
          id: editingPlan.id,
          name: formData.name,
          cpu: formData.cpu,
          ram: formData.ram,
          storage: formData.storage,
          bandwidth: formData.bandwidth,
          location: formData.location,
          pricePerMonth: priceInCents,
          currency: formData.currency,
          available: formData.available,
        });
        toast.success('Server plan updated successfully!');
      } else {
        await addPlan.mutateAsync({
          name: formData.name,
          cpu: formData.cpu,
          ram: formData.ram,
          storage: formData.storage,
          bandwidth: formData.bandwidth,
          location: formData.location,
          pricePerMonth: priceInCents,
          currency: formData.currency,
          available: formData.available,
        });
        toast.success('Server plan added successfully!');
      }
      setPlanDialogOpen(false);
      setEditingPlan(null);
      setFormData({
        name: '',
        cpu: '',
        ram: '',
        storage: '',
        bandwidth: '',
        location: '',
        pricePerMonth: '',
        currency: 'usd',
        available: true,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save server plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this server plan?')) return;

    try {
      await removePlan.mutateAsync(planId);
      toast.success('Server plan deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete server plan');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">Manage server plans, orders, and users.</p>
          </div>
          <Button onClick={() => setStripeDialogOpen(true)} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            {stripeConfigured ? 'Stripe Configured' : 'Configure Stripe'}
          </Button>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plans">
              <Server className="mr-2 h-4 w-4" />
              Server Plans
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Server Plans</CardTitle>
                    <CardDescription>Manage available dedicated server configurations.</CardDescription>
                  </div>
                  <Dialog open={planDialogOpen} onOpenChange={(open) => {
                    setPlanDialogOpen(open);
                    if (!open) {
                      setEditingPlan(null);
                      setFormData({
                        name: '',
                        cpu: '',
                        ram: '',
                        storage: '',
                        bandwidth: '',
                        location: '',
                        pricePerMonth: '',
                        currency: 'usd',
                        available: true,
                      });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Edit Server Plan' : 'Add New Server Plan'}</DialogTitle>
                        <DialogDescription>
                          Configure the specifications and pricing for a dedicated server plan.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitPlan} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Plan Name</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cpu">CPU</Label>
                            <Input
                              id="cpu"
                              value={formData.cpu}
                              onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                              placeholder="e.g., Intel Xeon E-2288G"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ram">RAM</Label>
                            <Input
                              id="ram"
                              value={formData.ram}
                              onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                              placeholder="e.g., 64GB DDR4"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="storage">Storage</Label>
                            <Input
                              id="storage"
                              value={formData.storage}
                              onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                              placeholder="e.g., 2x 1TB NVMe SSD"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bandwidth">Bandwidth</Label>
                            <Input
                              id="bandwidth"
                              value={formData.bandwidth}
                              onChange={(e) => setFormData({ ...formData, bandwidth: e.target.value })}
                              placeholder="e.g., 10TB/month"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="price">Price per Month ($)</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={formData.pricePerMonth}
                              onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                              placeholder="e.g., 199.99"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input
                              id="currency"
                              value={formData.currency}
                              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                              placeholder="e.g., usd"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="available"
                            checked={formData.available}
                            onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                          />
                          <Label htmlFor="available">Available for purchase</Label>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setPlanDialogOpen(false);
                              setEditingPlan(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={addPlan.isPending || updatePlan.isPending}>
                            {addPlan.isPending || updatePlan.isPending ? 'Saving...' : editingPlan ? 'Update Plan' : 'Add Plan'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : plans && plans.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Specs</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {plan.cpu} • {plan.ram} • {plan.storage}
                          </TableCell>
                          <TableCell>{plan.location}</TableCell>
                          <TableCell>{formatPrice(plan.pricePerMonth, plan.currency)}/mo</TableCell>
                          <TableCell>
                            <Badge variant={plan.available ? 'default' : 'secondary'}>
                              {plan.available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingPlan(plan)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePlan(plan.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No server plans yet. Add your first plan to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>View and manage customer orders.</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : orders && orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Server Plan</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id}</TableCell>
                          <TableCell>{order.serverPlan.name}</TableCell>
                          <TableCell className="font-mono text-xs">{order.user.toString().slice(0, 10)}...</TableCell>
                          <TableCell>{formatPrice(order.price, order.currency)}</TableCell>
                          <TableCell>
                            <Badge>{order.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No orders yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View registered users and their information.</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : users && users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.principal.toString()}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="font-mono text-xs">{user.principal.toString().slice(0, 20)}...</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No users registered yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <StripeSetupModal open={stripeDialogOpen} onOpenChange={setStripeDialogOpen} />
    </div>
  );
}
