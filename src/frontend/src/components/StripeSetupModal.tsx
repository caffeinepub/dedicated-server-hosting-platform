import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSetStripeConfiguration } from '../hooks/useQueries';

interface StripeSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StripeSetupModal({ open, onOpenChange }: StripeSetupModalProps) {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB,DE,FR');
  const setStripeConfig = useSetStripeConfiguration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    try {
      const allowedCountries = countries.split(',').map(c => c.trim()).filter(c => c);
      await setStripeConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries,
      });
      toast.success('Stripe configured successfully!');
      onOpenChange(false);
      setSecretKey('');
    } catch (error) {
      toast.error('Failed to configure Stripe');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Stripe Payment</DialogTitle>
          <DialogDescription>
            Enter your Stripe credentials to enable payment processing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              placeholder="sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="countries">Allowed Countries (comma-separated)</Label>
            <Input
              id="countries"
              placeholder="US,CA,GB,DE,FR"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={setStripeConfig.isPending}>
            {setStripeConfig.isPending ? 'Configuring...' : 'Configure Stripe'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
