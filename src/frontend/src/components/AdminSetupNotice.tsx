import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useState } from 'react';
import InvitationCodeRedemption from './InvitationCodeRedemption';
import { Button } from '@/components/ui/button';

export default function AdminSetupNotice() {
  const { identity } = useInternetIdentity();
  const { data: isCallerAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [redemptionOpen, setRedemptionOpen] = useState(false);

  const isAuthenticated = !!identity;

  // Don't show if still loading
  if (adminLoading) {
    return null;
  }

  // Don't show if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't show if user is already an admin
  if (isCallerAdmin) {
    return null;
  }

  // Show informational message for non-admin authenticated users
  return (
    <>
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Admin Access</AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span>
              If you have an admin invitation code, you can redeem it to gain admin privileges.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRedemptionOpen(true)}
              className="ml-4 shrink-0"
            >
              Redeem Code
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <InvitationCodeRedemption open={redemptionOpen} onOpenChange={setRedemptionOpen} />
    </>
  );
}
