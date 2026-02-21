import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useCreateDedicatedServer } from '../hooks/useQueries';
import { toast } from 'sonner';

export default function CreateServerDialog() {
  const [open, setOpen] = useState(false);
  const createServer = useCreateDedicatedServer();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    cpuCores: '',
    ramGb: '',
    storageGb: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createServer.mutateAsync({
        id: formData.id,
        name: formData.name,
        cpuCores: BigInt(formData.cpuCores),
        ramGb: BigInt(formData.ramGb),
        storageGb: BigInt(formData.storageGb),
      });
      toast.success('Server created successfully!');
      setOpen(false);
      setFormData({
        id: '',
        name: '',
        cpuCores: '',
        ramGb: '',
        storageGb: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create server');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Server
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Dedicated Server</DialogTitle>
          <DialogDescription>
            Add a new dedicated server to your infrastructure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id">Server ID</Label>
            <Input
              id="id"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="e.g., srv-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Production Server 1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpuCores">CPU Cores</Label>
            <Input
              id="cpuCores"
              type="number"
              min="1"
              value={formData.cpuCores}
              onChange={(e) => setFormData({ ...formData, cpuCores: e.target.value })}
              placeholder="e.g., 8"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ramGb">RAM (GB)</Label>
            <Input
              id="ramGb"
              type="number"
              min="1"
              value={formData.ramGb}
              onChange={(e) => setFormData({ ...formData, ramGb: e.target.value })}
              placeholder="e.g., 32"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storageGb">Storage (GB)</Label>
            <Input
              id="storageGb"
              type="number"
              min="1"
              value={formData.storageGb}
              onChange={(e) => setFormData({ ...formData, storageGb: e.target.value })}
              placeholder="e.g., 500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createServer.isPending}>
              {createServer.isPending ? 'Creating...' : 'Create Server'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
