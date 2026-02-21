import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Shield, AlertCircle } from 'lucide-react';
import { useRedeemAdminInvitation } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';

interface InvitationCodeRedemptionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvitationCodeRedemption({ open, onOpenChange }: InvitationCodeRedemptionProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const redeemInvitation = useRedeemAdminInvitation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please enter an invitation code');
      return;
    }

    try {
      await redeemInvitation.mutateAsync(code.trim());
      toast.success('Admin privileges granted successfully!');
      setCode('');
      onOpenChange(false);
      
      // Navigate to admin page after successful redemption
      setTimeout(() => {
        navigate({ to: '/admin' });
      }, 500);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to redeem invitation code';
      
      if (errorMessage.includes('Invalid invitation code')) {
        setError('This invitation code is invalid or has already been used.');
      } else if (errorMessage.includes('Anonymous')) {
        setError('Please log in first to redeem an invitation code.');
      } else {
        setError(errorMessage);
      }
      
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Redeem Admin Invitation</DialogTitle>
          </div>
          <DialogDescription>
            Enter the invitation code provided by an existing administrator to gain admin privileges.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invitation-code">Invitation Code</Label>
            <Input
              id="invitation-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder="Enter invitation code"
              className="font-mono"
              autoComplete="off"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={redeemInvitation.isPending || !code.trim()}>
              {redeemInvitation.isPending ? 'Redeeming...' : 'Redeem Code'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
