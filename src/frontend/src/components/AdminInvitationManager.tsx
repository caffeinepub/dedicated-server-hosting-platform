import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Plus, UserPlus } from 'lucide-react';
import { useCreateAdminInvitation, useGetActiveInvitations } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminInvitationManager() {
  const { data: invitations, isLoading } = useGetActiveInvitations();
  const createInvitation = useCreateAdminInvitation();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    try {
      const code = await createInvitation.mutateAsync();
      toast.success('Invitation code generated successfully!');
      
      // Auto-copy the newly generated code
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate invitation code');
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Admin Invitation Codes</CardTitle>
            <CardDescription>
              Generate invitation codes to grant admin privileges to other users.
            </CardDescription>
          </div>
          <Button onClick={handleGenerateCode} disabled={createInvitation.isPending}>
            {createInvitation.isPending ? (
              <>Generating...</>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : invitations && invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map(([code, creator]) => (
              <div
                key={code}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                      {code}
                    </code>
                    <Badge variant="outline" className="text-xs">
                      <UserPlus className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created by: {creator.toString().slice(0, 10)}...
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyCode(code)}
                  className="ml-4"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copiedCode === code ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <UserPlus className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No active invitation codes.</p>
            <p className="text-sm mt-1">Generate a code to invite new admins.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
