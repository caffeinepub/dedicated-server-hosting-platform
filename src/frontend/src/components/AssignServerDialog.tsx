import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAssignServerToUser, useAssignServerToPlan, useGetAllUsers, useGetServerPlans } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

interface AssignServerDialogProps {
  serverId: string;
  serverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssignServerDialog({ serverId, serverName, open, onOpenChange }: AssignServerDialogProps) {
  const [assignType, setAssignType] = useState<'user' | 'plan'>('user');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const { data: users } = useGetAllUsers();
  const { data: plans } = useGetServerPlans();
  const assignToUser = useAssignServerToUser();
  const assignToPlan = useAssignServerToPlan();

  const handleAssign = async () => {
    try {
      if (assignType === 'user') {
        if (!selectedUser) {
          toast.error('Please select a user');
          return;
        }
        await assignToUser.mutateAsync({
          serverId,
          user: Principal.fromText(selectedUser),
        });
        toast.success('Server assigned to user successfully!');
      } else {
        if (!selectedPlan) {
          toast.error('Please select a plan');
          return;
        }
        await assignToPlan.mutateAsync({
          serverId,
          planId: selectedPlan,
        });
        toast.success('Server assigned to plan successfully!');
      }
      onOpenChange(false);
      setSelectedUser('');
      setSelectedPlan('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign server');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Server: {serverName}</DialogTitle>
          <DialogDescription>
            Assign this server to a user or a subscription plan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assignment Type</Label>
            <RadioGroup value={assignType} onValueChange={(value) => setAssignType(value as 'user' | 'plan')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="font-normal cursor-pointer">Assign to User</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="plan" id="plan" />
                <Label htmlFor="plan" className="font-normal cursor-pointer">Assign to Plan</Label>
              </div>
            </RadioGroup>
          </div>

          {assignType === 'user' ? (
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.principal.toString()} value={user.principal.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="plan-select">Select Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger id="plan-select">
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignToUser.isPending || assignToPlan.isPending}
            >
              {assignToUser.isPending || assignToPlan.isPending ? 'Assigning...' : 'Assign Server'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
