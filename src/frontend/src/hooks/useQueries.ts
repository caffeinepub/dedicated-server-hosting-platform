import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ServerPlan, UserProfile, ShoppingCart, Order, Invoice, UpdatePlanInput, StripeConfiguration, CheckResult, UserRole, CustomServerConfig } from '../backend';

// Server Plans
export function useGetServerPlans() {
  const { actor, isFetching } = useActor();

  return useQuery<ServerPlan[]>({
    queryKey: ['serverPlans'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getServerPlans();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPlanById(planId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ServerPlan | null>({
    queryKey: ['serverPlan', planId],
    queryFn: async () => {
      if (!actor || !planId) return null;
      try {
        return await actor.getPlanById(planId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!planId,
  });
}

export function useAddServerPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: {
      name: string;
      cpu: string;
      ram: string;
      storage: string;
      bandwidth: string;
      location: string;
      pricePerMonth: bigint;
      currency: string;
      available: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addServerPlan(
        plan.name,
        plan.cpu,
        plan.ram,
        plan.storage,
        plan.bandwidth,
        plan.location,
        plan.pricePerMonth,
        plan.currency,
        plan.available
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverPlans'] });
    },
  });
}

export function useUpdateServerPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: UpdatePlanInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateServerPlan(update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverPlans'] });
    },
  });
}

export function useRemoveServerPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeServerPlan(planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverPlans'] });
    },
  });
}

// User Profile
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Shopping Cart
export function useGetCart() {
  const { actor, isFetching } = useActor();

  return useQuery<ShoppingCart | null>({
    queryKey: ['cart'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCart();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addToCart(planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useAddCustomServerToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: CustomServerConfig) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCustomServerToCart(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveFromCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeFromCart(planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClearCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Checkout
export function useCheckout() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ successUrl, cancelUrl }: { successUrl: string; cancelUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.checkout(successUrl, cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      return session;
    },
  });
}

// Orders
export function useGetUserOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<Order[]>({
    queryKey: ['userOrders'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const identity = await actor.getCallerUserProfile();
        if (!identity) return [];
        return await actor.getUserOrders(identity.principal);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<Order[]>({
    queryKey: ['allOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

// Invoices
export function useGetUserInvoices() {
  const { actor, isFetching } = useActor();

  return useQuery<Invoice[]>({
    queryKey: ['userInvoices'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const identity = await actor.getCallerUserProfile();
        if (!identity) return [];
        return await actor.getUserInvoices(identity.principal);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllInvoices() {
  const { actor, isFetching } = useActor();

  return useQuery<Invoice[]>({
    queryKey: ['allInvoices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInvoices();
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin - Unified admin status hook using checkAdminStatus
export function useAdminStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<CheckResult>({
    queryKey: ['adminStatus'],
    queryFn: async () => {
      if (!actor) {
        return {
          hasAdmin: false,
          adminCount: BigInt(0),
          isAnonymous: true,
        };
      }
      try {
        return await actor.checkAdminStatus();
      } catch {
        return {
          hasAdmin: false,
          adminCount: BigInt(0),
          isAnonymous: true,
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

// Derived hook for hasAdmin (uses unified adminStatus)
export function useHasAdmin() {
  const { data: adminStatus, isLoading, isFetched } = useAdminStatus();

  return {
    data: adminStatus?.hasAdmin ?? false,
    isLoading,
    isFetched,
  };
}

// Admin role check using getCallerUserRole from AccessControl
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const role = await actor.getCallerUserRole();
        return role === 'admin';
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useAutoAssignAdminOnLogin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const wasAssigned = await actor.autoAssignAdminOnLogin();
      return wasAssigned;
    },
    onSuccess: async (wasAssigned) => {
      if (wasAssigned) {
        // Invalidate unified admin status and caller admin queries
        await queryClient.invalidateQueries({ queryKey: ['adminStatus'] });
        await queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
        await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        
        // Force refetch to ensure immediate state update
        await queryClient.refetchQueries({ queryKey: ['adminStatus'] });
        await queryClient.refetchQueries({ queryKey: ['isCallerAdmin'] });
      }
    },
    retry: false,
  });
}

export function usePromoteToAdminIfNeeded() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.promoteToAdminIfNeeded();
    },
    onSuccess: async () => {
      // Invalidate unified admin status and caller admin queries
      await queryClient.invalidateQueries({ queryKey: ['adminStatus'] });
      await queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      
      // Force refetch to ensure immediate state update
      await queryClient.refetchQueries({ queryKey: ['adminStatus'] });
      await queryClient.refetchQueries({ queryKey: ['isCallerAdmin'] });
    },
    retry: false,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

// Stripe
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
    },
  });
}

export function useSeedDefaultPlans() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.seedDefaultPlans();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverPlans'] });
    },
  });
}
