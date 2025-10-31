import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyRepository } from '../api/repositories';
import type { Database } from '../lib/database.types';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export function useProperties(filters?: any) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertyRepository.getAll(filters),
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => (id ? propertyRepository.getById(id) : Promise.resolve({ data: null, error: null })),
    enabled: !!id,
  });
}

export function useOwnerProperties(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['properties', 'owner', ownerId],
    queryFn: () =>
      ownerId
        ? propertyRepository.getByOwnerId(ownerId)
        : Promise.resolve({ data: [], error: null }),
    enabled: !!ownerId,
  });
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => propertyRepository.getFeatured(),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (property: PropertyInsert) => propertyRepository.create(property),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PropertyUpdate }) =>
      propertyRepository.update(id, updates),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['property', data.data.id] });
        queryClient.invalidateQueries({ queryKey: ['properties'] });
      }
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => propertyRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useIncrementPropertyViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => propertyRepository.incrementViewCount(propertyId),
    onSuccess: (data, propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    },
  });
}
