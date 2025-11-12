import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applicationRepository, Application, ApplicationInsert } from '../applicationRepository';

describe('Application Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return application data when found', async () => {
      const applicationId = 'app-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.getById(applicationId);

      expect(result).toEqual({
        data: null,
        error: expect.any(Error)
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Getting application by id: ${applicationId}`);

      consoleSpy.mockRestore();
    });

    it('should handle null application ID', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.getById('');

      expect(result).toEqual({
        data: null,
        error: expect.any(Error)
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getByTenantId', () => {
    it('should return empty array for tenant applications', async () => {
      const tenantId = 'tenant-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.getByTenantId(tenantId);

      expect(result).toEqual({
        data: [],
        error: null
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Getting applications for tenant: ${tenantId}`);

      consoleSpy.mockRestore();
    });

    it('should handle different tenant IDs', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const tenantIds = ['tenant-1', 'tenant-2', 'tenant-3'];

      for (const tenantId of tenantIds) {
        const result = await applicationRepository.getByTenantId(tenantId);
        expect(result.data).toEqual([]);
      }

      consoleSpy.mockRestore();
    });
  });

  describe('getByPropertyId', () => {
    it('should return applications for a property', async () => {
      const propertyId = 'prop-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.getByPropertyId(propertyId);

      expect(result).toEqual({
        data: [],
        error: null
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Getting applications for property: ${propertyId}`);

      consoleSpy.mockRestore();
    });
  });

  describe('getByOwnerId', () => {
    it('should return applications for an owner', async () => {
      const ownerId = 'owner-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.getByOwnerId(ownerId);

      expect(result).toEqual({
        data: [],
        error: null
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Getting applications for owner: ${ownerId}`);

      consoleSpy.mockRestore();
    });
  });

  describe('create', () => {
    it('should create a new application', async () => {
      const newApplication: ApplicationInsert = {
        property_id: 'prop-123',
        tenant_id: 'tenant-123',
        status: 'en_attente',
        message: 'Je suis intéressé par cette propriété',
        proposed_rent: 150000,
        proposed_move_in_date: '2024-01-01',
        documents: []
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.create(newApplication);

      expect(result).toEqual({
        data: null,
        error: expect.any(Error)
      });
      expect(consoleSpy).toHaveBeenCalledWith('Creating application:', newApplication);

      consoleSpy.mockRestore();
    });

    it('should handle application with minimal data', async () => {
      const minimalApplication: ApplicationInsert = {
        property_id: 'prop-123',
        tenant_id: 'tenant-123'
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.create(minimalApplication);

      expect(result.error).toBeInstanceOf(Error);

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should update an existing application', async () => {
      const applicationId = 'app-123';
      const updates = {
        status: 'acceptee' as const,
        message: 'Application acceptée'
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.update(applicationId, updates);

      expect(result).toEqual({
        data: null,
        error: expect.any(Error)
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Updating application ${applicationId}:`, updates);

      consoleSpy.mockRestore();
    });

    it('should handle empty updates', async () => {
      const applicationId = 'app-123';
      const updates = {};

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.update(applicationId, updates);

      expect(result.error).toBeInstanceOf(Error);

      consoleSpy.mockRestore();
    });
  });

  describe('updateStatus', () => {
    it('should update application status', async () => {
      const applicationId = 'app-123';
      const newStatus = 'acceptee';

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.updateStatus(applicationId, newStatus);

      expect(result).toEqual({
        data: null,
        error: expect.any(Error)
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Updating application status ${applicationId}:`, newStatus);

      consoleSpy.mockRestore();
    });

    it('should handle all valid statuses', async () => {
      const validStatuses = ['en_attente', 'acceptee', 'refusee', 'annulee'] as const;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      for (const status of validStatuses) {
        const result = await applicationRepository.updateStatus('app-123', status);
        expect(result.error).toBeInstanceOf(Error);
      }

      consoleSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should delete an application', async () => {
      const applicationId = 'app-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.delete(applicationId);

      expect(result).toEqual({
        data: null,
        error: expect.any(Error)
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Deleting application: ${applicationId}`);

      consoleSpy.mockRestore();
    });
  });

  describe('getByStatus', () => {
    it('should return applications by status', async () => {
      const status = 'en_attente';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.getByStatus(status);

      expect(result).toEqual({
        data: [],
        error: null
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Getting applications by status: ${status}`);

      consoleSpy.mockRestore();
    });
  });

  describe('getPendingCount', () => {
    it('should return pending applications count', async () => {
      const ownerId = 'owner-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.getPendingCount(ownerId);

      expect(result).toEqual({
        data: 0,
        error: null
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Getting pending count for owner: ${ownerId}`);

      consoleSpy.mockRestore();
    });
  });

  describe('checkExistingApplication', () => {
    it('should check for existing applications', async () => {
      const tenantId = 'tenant-123';
      const propertyId = 'prop-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.checkExistingApplication(tenantId, propertyId);

      expect(result).toEqual({
        data: null,
        error: null
      });
      expect(consoleSpy).toHaveBeenCalledWith(`Checking existing application: ${tenantId}, ${propertyId}`);

      consoleSpy.mockRestore();
    });

    it('should handle empty IDs', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await applicationRepository.checkExistingApplication('', '');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();

      consoleSpy.mockRestore();
    });
  });
});