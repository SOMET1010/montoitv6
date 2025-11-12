/**
 * Shared TypeScript types and interfaces
 * These are application-level types, not database types
 */

import type { Database } from '../lib/database.types';

// Re-export database types for convenience
export type Property = Database['public']['Tables']['properties']['Row'];
export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Lease = Database['public']['Tables']['leases']['Row'];
export type LeaseInsert = Database['public']['Tables']['leases']['Insert'];
export type LeaseUpdate = Database['public']['Tables']['leases']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

// Application-specific types

export interface PropertyFilters {
  propertyType?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  searchQuery?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type PropertyStatus = Database['public']['Tables']['properties']['Row']['status'];
export type LeaseStatus = 'draft' | 'pending' | 'active' | 'expired' | 'terminated';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type UserType = 'tenant' | 'owner' | 'agency';

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData extends LoginFormData {
  fullName: string;
  userType: UserType;
  confirmPassword: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  propertyType: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  images: File[];
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = () => Promise<T>;
