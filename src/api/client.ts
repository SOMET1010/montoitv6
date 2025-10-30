/**
 * API Client
 * Centralized Supabase client configuration and helper functions
 */

import { supabase } from '../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export interface ApiResponse<T> {
  data: T | null;
  error: PostgrestError | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number | null;
  error: PostgrestError | null;
}

/**
 * Helper to handle Supabase query responses with consistent error handling
 */
export async function handleQuery<T>(
  queryPromise: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await queryPromise;

    if (error) {
      console.error('API Error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
        hint: '',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Helper to handle paginated queries
 */
export async function handlePaginatedQuery<T>(
  queryBuilder: ReturnType<typeof supabase.from>,
  page: number = 1,
  pageSize: number = 12
): Promise<PaginatedResponse<T>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error, count } = await queryBuilder.range(from, to);

    if (error) {
      console.error('API Error:', error);
      return { data: [], count: null, error };
    }

    return { data: data as T[], count, error: null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      data: [],
      count: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
        hint: '',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Helper to handle file uploads to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ data: { path: string } | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('Upload error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown upload error'),
    };
  }
}

/**
 * Helper to get public URL for a file in Storage
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Helper to delete a file from Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Unexpected delete error:', error);
    return {
      error: error instanceof Error ? error : new Error('Unknown delete error'),
    };
  }
}

/**
 * Helper to call Edge Functions
 */
export async function callEdgeFunction<TRequest = unknown, TResponse = unknown>(
  functionName: string,
  body: TRequest
): Promise<{ data: TResponse | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke<TResponse>(functionName, {
      body,
    });

    if (error) {
      console.error('Edge Function error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected Edge Function error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown function error'),
    };
  }
}

export { supabase };
