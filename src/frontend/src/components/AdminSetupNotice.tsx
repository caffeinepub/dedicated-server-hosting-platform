import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminStatus, useAutoAssignAdminOnLogin, useIsCallerAdmin } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';

export default function AdminSetupNotice() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const { data: adminStatus, isLoading: adminStatusLoading, isFetched: adminStatusFetched } = useAdminStatus();
  const { data: isCallerAdmin, isFetched: isCallerAdminFetched } = useIsCallerAdmin();
  const autoAssignAdmin = useAutoAssignAdminOnLogin();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [permanentError, setPermanentError] = useState(false);

  const isAuthenticated = !!identity;
  const hasAdmin = adminStatus?.hasAdmin ?? false;
  const isAnonymous = adminStatus?.isAnonymous ?? true;

  // Automatically attempt admin assignment when authenticated and no admin exists
  useEffect(() => {
    const attemptAutoAssign = async () => {
      // Only attempt if:
      // 1. User is authenticated
      // 2. Actor is available
      // 3. adminStatus query has loaded
      // 4. No admin exists
      // 5. User is not anonymous
      // 6. Haven't already attempted
      // 7. Not currently attempting
      // 8. No permanent error state
      if (
        isAuthenticated &&
        actor &&
        !adminStatusLoading &&
        adminStatusFetched &&
        !hasAdmin &&
        !isAnonymous &&
        !hasAttempted &&
        !autoAssignAdmin.isPending &&
        !permanentError
      ) {
        setHasAttempted(true);
        setErrorMessage(null);
        setShowSuccess(false);

        try {
          const wasAssigned = await autoAssignAdmin.mutateAsync();
          
          if (wasAssigned) {
            setShowSuccess(true);
            setPermanentError(false);
          }
        } catch (error: any) {
          console.error('Failed to auto-assign admin:', error);
          
          // Extract meaningful error message
          let message = 'Failed to assign admin privileges automatically.';
          let isPermanent = false;
          
          if (error?.message) {
            if (error.message.includes('already exists') || error.message.includes('Unauthorized')) {
              message = 'An admin already exists in the system. If you believe you should be an admin, please contact the existing administrator.';
              isPermanent = true;
            } else if (error.message.includes('Actor not available')) {
              message = 'Connection to backend is not ready. Please wait...';
              // Reset attempt flag to retry when actor becomes available
              setHasAttempted(false);
            } else if (error.message.includes('Anonymous')) {
              message = 'Please log in first to become an admin.';
              isPermanent = true;
            } else {
              message = error.message;
            }
          }
          
          setErrorMessage(message);
          setPermanentError(isPermanent);
          setShowSuccess(false);
        }
      }
    };

    attemptAutoAssign();
  }, [isAuthenticated, actor, adminStatusLoading, adminStatusFetched, hasAdmin, isAnonymous, hasAttempted, autoAssignAdmin, permanentError]);

  // Don't show if still loading or if admin already exists
  if (adminStatusLoading || hasAdmin) {
    return null;
  }

  // Don't show if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't show if actor is not available yet
  if (!actor) {
    return null;
  }

  // Don't show if user is anonymous
  if (isAnonymous) {
    return null;
  }

  const handleRetry = () => {
    setHasAttempted(false);
    setErrorMessage(null);
    setPermanentError(false);
  };

  // Show success state
  if (showSuccess && isCallerAdminFetched && isCallerAdmin) {
    return (
      <Alert className="border-success bg-success/10">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AlertTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Success!
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm font-medium text-success">
            Admin privileges assigned successfully. You now have full access to the admin panel.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading state while attempting
  if (autoAssignAdmin.isPending) {
    return (
      <Alert className="border-primary bg-primary/10">
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
        <AlertTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Setting Up Admin
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm">
            Automatically assigning admin privileges to the first user. Please wait...
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Show error state with retry option
  if (errorMessage) {
    return (
      <Alert className="border-destructive bg-destructive/10">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Admin Setup Error
        </AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-3">
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive font-medium">{errorMessage}</p>
          </div>
          {!permanentError && (
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="w-fit"
            >
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Initial state (should briefly show before auto-assignment starts)
  return (
    <Alert className="border-warning bg-warning/10">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertTitle className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Admin Setup Required
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">
          No admin exists yet. You will be automatically assigned admin privileges as the first user.
        </p>
      </AlertDescription>
    </Alert>
  );
}
