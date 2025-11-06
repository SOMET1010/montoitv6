/**
 * MZAKA Platform - TypeScript Types
 * Simplified types for the marketplace
 */

import type { Database } from '../lib/database.types';

// Database types
export type Property = Database['public']['Tables']['properties']['Row'];
export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export type Visit = Database['public']['Tables']['visits']['Row'];
export type VisitInsert = Database['public']['Tables']['visits']['Insert'];
export type VisitUpdate = Database['public']['Tables']['visits']['Update'];

export type Favorite = Database['public']['Tables']['favorites']['Row'];

// Application-specific types

export interface PropertyFilters {
  propertyType?: string;
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  isFurnished?: boolean;
  petsAllowed?: boolean;
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

export type PropertyStatus = 'available' | 'rented' | 'unavailable';
export type VisitStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type UserType = 'tenant' | 'owner' | 'both';

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
  phone: string;
  userType: UserType;
  confirmPassword: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  propertyType: string;
  city: string;
  neighborhood: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  isFurnished: boolean;
  petsAllowed: boolean;
  images: File[];
}

export interface MessageFormData {
  content: string;
  propertyId: string;
  receiverId: string;
}

export interface VisitFormData {
  propertyId: string;
  requestedDate: Date;
  notes?: string;
}

// UI types
export interface PropertyWithOwner extends Property {
  owner: Profile;
  isFavorite?: boolean;
}

export interface ConversationGroup {
  propertyId: string;
  property: Property;
  otherUser: Profile;
  lastMessage: Message;
  unreadCount: number;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = () => Promise<T>;
