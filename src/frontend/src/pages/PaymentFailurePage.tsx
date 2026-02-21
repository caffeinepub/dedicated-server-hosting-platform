import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-destructive">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-3xl">Payment Failed</CardTitle>
            <CardDescription className="text-base">
              Your payment could not be processed. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                Your order has not been placed and no charges have been made to your account.
              </p>
              <p className="text-sm text-muted-foreground">
                If you continue to experience issues, please contact our support team.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate({ to: '/dashboard' })} className="flex-1">
                Return to Cart
              </Button>
              <Button onClick={() => navigate({ to: '/plans' })} variant="outline" className="flex-1">
                Browse Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
