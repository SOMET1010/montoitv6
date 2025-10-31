import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaseRepository } from '../api/repositories';
import type { Database } from '../lib/database.types';

type LeaseInsert = Database['public']['Tables']['leases']['Insert'];
type LeaseUpdate = Database['public']['Tables']['leases']['Update'];

export function useLease(id: string | undefined) {
  return useQuery({
    queryKey: ['lease', id],
    queryFn: () => (id ? leaseRepository.getById(id) : Promise.resolve({ data: null, error: null })),
    enabled: !!id,
  });
}

export function useTenantLeases(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['leases', 'tenant', tenantId],
    queryFn: () =>
      tenantId ? leaseRepository.getByTenantId(tenantId) : Promise.resolve({ data: [], error: null }),
    enabled: !!tenantId,
  });
}

export function useLandlordLeases(landlordId: string | undefined) {
  return useQuery({
    queryKey: ['leases', 'landlord', landlordId],
    queryFn: () =>
      landlordId
        ? leaseRepository.getByLandlordId(landlordId)
        : Promise.resolve({ data: [], error: null }),
    enabled: !!landlordId,
  });
}

export function usePropertyLeases(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['leases', 'property', propertyId],
    queryFn: () =>
      propertyId
        ? leaseRepository.getByPropertyId(propertyId)
        : Promise.resolve({ data: [], error: null }),
    enabled: !!propertyId,
  });
}

export function useActiveLease(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['lease', 'active', tenantId],
    queryFn: () =>
      tenantId
        ? leaseRepository.getActiveByTenantId(tenantId)
        : Promise.resolve({ data: null, error: null }),
    enabled: !!tenantId,
  });
}

export function useExpiringLeases(daysBeforeExpiry: number = 30) {
  return useQuery({
    queryKey: ['leases', 'expiring', daysBeforeExpiry],
    queryFn: () => leaseRepository.getExpiringLeases(daysBeforeExpiry),
  });
}

export function useCreateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lease: LeaseInsert) => leaseRepository.create(lease),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });
}

export function useUpdateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: LeaseUpdate }) =>
      leaseRepository.update(id, updates),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['lease', data.data.id] });
        queryClient.invalidateQueries({ queryKey: ['leases'] });
      }
    },
  });
}

export function useUpdateLeaseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leaseRepository.updateStatus(id, status),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['lease', data.data.id] });
        queryClient.invalidateQueries({ queryKey: ['leases'] });
      }
    },
  });
}
