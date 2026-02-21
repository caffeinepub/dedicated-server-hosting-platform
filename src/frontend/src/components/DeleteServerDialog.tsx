import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteDedicatedServer } from '../hooks/useQueries';
import { toast } from 'sonner';

interface DeleteServerDialogProps {
  serverId: string;
  serverName: string;
  isAssigned: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteServerDialog({ serverId, serverName, isAssigned, open, onOpenChange }: DeleteServerDialogProps) {
  const deleteServer = useDeleteDedicatedServer();

  const handleDelete = async () => {
    try {
      await deleteServer.mutateAsync(serverId);
      toast.success('Server deleted successfully!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete server');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Server: {serverName}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the server from your infrastructure.
            {isAssigned && (
              <span className="block mt-2 text-destructive font-medium">
                Warning: This server is currently assigned. Deleting it may affect active services.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteServer.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteServer.isPending ? 'Deleting...' : 'Delete Server'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
