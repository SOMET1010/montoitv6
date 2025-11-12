import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn()
    },
    storage: {
      listBuckets: vi.fn()
    }
  }
}));

import { performHealthCheck, testDatabaseConnection, testAuthConnection, testStorageConnection } from '../supabaseHealthCheck';

describe('Supabase Health Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('performHealthCheck', () => {
    it('should return healthy status when all checks pass', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { count: 1 }, error: null })
          })
        })
      });

      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: {} }, error: null });
      mockSupabase.storage.listBuckets.mockResolvedValue({ data: [{}], error: null });

      const result = await performHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.checks.database).toBe(true);
      expect(result.checks.auth).toBe(true);
      expect(result.checks.storage).toBe(true);
      expect(result.checks.edgeFunctions).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return degraded status when some checks fail', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
          })
        })
      });

      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: {} }, error: null });
      mockSupabase.storage.listBuckets.mockResolvedValue({ data: [{}], error: null });

      const result = await performHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.checks.database).toBe(false);
      expect(result.checks.auth).toBe(true);
      expect(result.checks.storage).toBe(true);
      expect(result.errors).toContain('Database: DB Error');
    });

    it('should return unhealthy status when most checks fail', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
          })
        })
      });

      mockSupabase.auth.getSession.mockResolvedValue({ data: null, error: new Error('Auth Error') });
      mockSupabase.storage.listBuckets.mockResolvedValue({ data: null, error: new Error('Storage Error') });

      const result = await performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database).toBe(false);
      expect(result.checks.auth).toBe(false);
      expect(result.checks.storage).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle timeout errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10000)))
          })
        })
      });

      const result = await performHealthCheck();

      expect(result.checks.database).toBe(false);
      expect(result.errors.some(e => e.includes('timeout'))).toBe(true);
    });
  });

  describe('testDatabaseConnection', () => {
    it('should return success when database is accessible', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await testDatabaseConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Database connection successful');
    });

    it('should return error when database fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: new Error('Connection failed') })
        })
      });

      const result = await testDatabaseConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection failed');
    });

    it('should handle timeout errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10000)))
        })
      });

      const result = await testDatabaseConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('expiré');
    });
  });

  describe('testAuthConnection', () => {
    it('should return success when auth is accessible', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: {} }, error: null });

      const result = await testAuthConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Auth connection successful');
    });

    it('should return error when auth fails', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: null, error: new Error('Auth failed') });

      const result = await testAuthConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Auth failed');
    });
  });

  describe('testStorageConnection', () => {
    it('should return success when storage is accessible', async () => {
      mockSupabase.storage.listBuckets.mockResolvedValue({ data: [{ name: 'test' }], error: null });

      const result = await testStorageConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Storage connection successful');
      expect(result.message).toContain('(1 buckets found)');
    });

    it('should return error when storage fails', async () => {
      mockSupabase.storage.listBuckets.mockResolvedValue({ data: null, error: new Error('Storage failed') });

      const result = await testStorageConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Storage failed');
    });
  });
});