import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useClearCart } from '../hooks/useQueries';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const clearCart = useClearCart();

  useEffect(() => {
    clearCart.mutate();
  }, []);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-chart-1">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-chart-1/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-chart-1" />
            </div>
            <CardTitle className="text-3xl">Payment Successful!</CardTitle>
            <CardDescription className="text-base">
              Your order has been confirmed and your servers will be provisioned shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                You will receive an email confirmation with your server details and access credentials within the next few minutes.
              </p>
              <p className="text-sm text-muted-foreground">
                You can view your order status and manage your servers from your dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate({ to: '/dashboard' })} className="flex-1">
                Go to Dashboard
              </Button>
              <Button onClick={() => navigate({ to: '/plans' })} variant="outline" className="flex-1">
                Browse More Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
