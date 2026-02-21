import { useState } from 'react';
import { useGetServerPlans, useAddToCart, useAddCustomServerToCart } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Cpu, HardDrive, Network, MapPin, ShoppingCart, Settings } from 'lucide-react';
import type { ServerPlan, CustomServerConfig } from '../backend';

export default function PlansPage() {
  const { data: plans, isLoading } = useGetServerPlans();
  const { identity, login } = useInternetIdentity();
  const addToCart = useAddToCart();
  const addCustomServerToCart = useAddCustomServerToCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addingCustom, setAddingCustom] = useState(false);

  // Custom server configuration state
  const [cpuCores, setCpuCores] = useState<number>(2);
  const [ramGb, setRamGb] = useState<number>(4);
  const [storageGb, setStorageGb] = useState<number>(100);
  const [bandwidthMbps, setBandwidthMbps] = useState<number>(100);
  const [location, setLocation] = useState<string>('us-east');
  const [durationMonths, setDurationMonths] = useState<number>(1);

  const handleAddToCart = async (plan: ServerPlan) => {
    if (!identity) {
      toast.error('Please login to add items to cart');
      login();
      return;
    }

    setAddingToCart(plan.id);
    try {
      await addToCart.mutateAsync(plan.id);
      toast.success(`${plan.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleAddCustomToCart = async () => {
    if (!identity) {
      toast.error('Please login to add items to cart');
      login();
      return;
    }

    setAddingCustom(true);
    try {
      const config: CustomServerConfig = {
        cpuCores: BigInt(cpuCores),
        ramGb: BigInt(ramGb),
        storageGb: BigInt(storageGb),
        bandwidthMbps: BigInt(bandwidthMbps),
        location,
        durationMonths: BigInt(durationMonths),
      };
      await addCustomServerToCart.mutateAsync(config);
      toast.success('Custom server added to cart!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add custom server to cart');
    } finally {
      setAddingCustom(false);
    }
  };

  const calculateCustomPrice = (): number => {
    const baseCpuPrice = 500;
    const baseRamPrice = 250;
    const baseStoragePrice = 100;
    const baseBandwidthPrice = 50;
    const priceMultiplier = 1000;

    const cpuCost = cpuCores * baseCpuPrice;
    const ramCost = ramGb * baseRamPrice;
    const storageCost = storageGb * baseStoragePrice;
    const bandwidthCost = Math.floor(bandwidthMbps / 10) * baseBandwidthPrice;

    const monthlyCost = cpuCost + ramCost + storageCost + bandwidthCost;
    const totalCost = monthlyCost * durationMonths;
    return (totalCost * priceMultiplier) / 1000;
  };

  const formatPrice = (price: bigint | number, currency: string) => {
    const amount = typeof price === 'bigint' ? Number(price) / 100 : price / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const availablePlans = plans?.filter(p => p.available) || [];

  return (
    <div className="container py-12">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Dedicated Server Plans
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the perfect server configuration for your needs. All plans include full root access and 24/7 support.
          </p>
        </div>

        {availablePlans.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No server plans available at the moment.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => (
              <Card key={plan.id} className="flex flex-col border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {plan.location}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="pt-4">
                    <div className="text-3xl font-bold">
                      {formatPrice(plan.pricePerMonth, plan.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Cpu className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">CPU</div>
                        <div className="text-sm text-muted-foreground">{plan.cpu}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-chart-1/10 flex items-center justify-center">
                        <HardDrive className="h-4 w-4 text-chart-1" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">RAM & Storage</div>
                        <div className="text-sm text-muted-foreground">{plan.ram} / {plan.storage}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-chart-2/10 flex items-center justify-center">
                        <Network className="h-4 w-4 text-chart-2" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Bandwidth</div>
                        <div className="text-sm text-muted-foreground">{plan.bandwidth}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(plan)}
                    disabled={addingToCart === plan.id}
                  >
                    {addingToCart === plan.id ? (
                      'Adding...'
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Separator className="my-12" />

        {/* Custom Package Section */}
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">Custom Package</h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Build your own server configuration tailored to your exact requirements.
            </p>
          </div>

          <Card className="max-w-3xl mx-auto border-primary/20">
            <CardHeader>
              <CardTitle>Configure Your Server</CardTitle>
              <CardDescription>
                Select your desired specifications and see the price update in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cpu">CPU Cores</Label>
                  <Input
                    id="cpu"
                    type="number"
                    min="1"
                    max="64"
                    value={cpuCores}
                    onChange={(e) => setCpuCores(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ram">RAM (GB)</Label>
                  <Input
                    id="ram"
                    type="number"
                    min="1"
                    max="512"
                    value={ramGb}
                    onChange={(e) => setRamGb(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage">Storage (GB)</Label>
                  <Input
                    id="storage"
                    type="number"
                    min="10"
                    max="10000"
                    value={storageGb}
                    onChange={(e) => setStorageGb(Math.max(10, parseInt(e.target.value) || 10))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bandwidth">Bandwidth (Mbps)</Label>
                  <Input
                    id="bandwidth"
                    type="number"
                    min="10"
                    max="10000"
                    value={bandwidthMbps}
                    onChange={(e) => setBandwidthMbps(Math.max(10, parseInt(e.target.value) || 10))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger id="location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east">US East</SelectItem>
                      <SelectItem value="us-west">US West</SelectItem>
                      <SelectItem value="eu-central">EU Central</SelectItem>
                      <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="36"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Estimated Monthly Price</div>
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(calculateCustomPrice() / durationMonths, 'usd')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total for {durationMonths} {durationMonths === 1 ? 'month' : 'months'}: {formatPrice(calculateCustomPrice(), 'usd')}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddCustomToCart}
                disabled={addingCustom}
              >
                {addingCustom ? (
                  'Adding...'
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add Custom Package to Cart
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
