import { describe, it, expect, vi, beforeEach } from 'vitest';
import { propertyRepository } from '../propertyRepository';

// Mock supabase
const mockSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn()
  }
};

vi.mock('../../client', () => ({
  supabase: mockSupabase,
  handleQuery: vi.fn()
}));

describe('Property Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should fetch property by ID', async () => {
      const propertyId = 'prop-123';
      const mockProperty = {
        id: propertyId,
        title: 'Test Property',
        address: 'Test Address',
        city: 'Abidjan'
      };

      const queryBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProperty, error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: mockProperty, error: null });

      const result = await propertyRepository.getById(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', propertyId);
    });

    it('should handle property not found', async () => {
      const propertyId = 'nonexistent';

      const queryBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: null, error: new Error('Not found') });

      const result = await propertyRepository.getById(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
    });
  });

  describe('getAll', () => {
    it('should fetch all properties', async () => {
      const mockProperties = [
        { id: 'prop-1', title: 'Property 1' },
        { id: 'prop-2', title: 'Property 2' }
      ];

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProperties, error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: mockProperties, error: null });

      const result = await propertyRepository.getAll();

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle pagination parameters', async () => {
      const pagination = { page: 1, pageSize: 10 };
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: [], error: null });

      const result = await propertyRepository.getAll(pagination);

      expect(queryBuilder.range).toHaveBeenCalledWith(0, 9);
    });
  });

  describe('search', () => {
    it('should search properties with filters', async () => {
      const searchParams = {
        city: 'Abidjan',
        propertyType: 'appartement',
        minPrice: 100000,
        maxPrice: 300000
      };

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: [], error: null });

      const result = await propertyRepository.search(searchParams);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'disponible');
    });

    it('should handle search with query string', async () => {
      const searchParams = {
        searchQuery: 'cocody',
        city: 'Abidjan'
      };

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: [], error: null });

      const result = await propertyRepository.search(searchParams);

      expect(queryBuilder.or).toHaveBeenCalled();
    });
  });

  describe('getByOwnerId', () => {
    it('should fetch properties by owner ID', async () => {
      const ownerId = 'owner-123';

      const queryBuilder = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: [], error: null });

      const result = await propertyRepository.getByOwnerId(ownerId);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(queryBuilder.eq).toHaveBeenCalledWith('owner_id', ownerId);
    });
  });

  describe('create', () => {
    it('should create a new property', async () => {
      const newProperty = {
        owner_id: 'owner-123',
        title: 'New Property',
        address: 'Test Address',
        city: 'Abidjan',
        monthly_rent: 150000,
        property_type: 'appartement',
        bedrooms: 2,
        bathrooms: 1,
        surface_area: 75
      };

      const queryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'prop-new', ...newProperty }, error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: { id: 'prop-new', ...newProperty }, error: null });

      const result = await propertyRepository.create(newProperty as any);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(queryBuilder.insert).toHaveBeenCalledWith(newProperty);
    });

    it('should handle creation errors', async () => {
      const invalidProperty = {
        owner_id: null,
        title: '',
        monthly_rent: -1000
      };

      const queryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Invalid data') })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: null, error: new Error('Invalid data') });

      const result = await propertyRepository.create(invalidProperty as any);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
    });
  });

  describe('update', () => {
    it('should update an existing property', async () => {
      const propertyId = 'prop-123';
      const updates = {
        title: 'Updated Property',
        monthly_rent: 200000
      };

      const queryBuilder = {
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: propertyId, ...updates }, error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: { id: propertyId, ...updates }, error: null });

      const result = await propertyRepository.update(propertyId, updates as any);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', propertyId);
      expect(queryBuilder.update).toHaveBeenCalledWith(updates);
    });
  });

  describe('delete', () => {
    it('should delete a property', async () => {
      const propertyId = 'prop-123';

      const queryBuilder = {
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      mockSupabase.from.mockReturnValue(queryBuilder);

      const { handleQuery } = await import('../../client');
      (handleQuery as any).mockResolvedValue({ data: null, error: null });

      const result = await propertyRepository.delete(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', propertyId);
      expect(queryBuilder.delete).toHaveBeenCalled();
    });
  });

  describe('uploadImages', () => {
    it('should upload property images', async () => {
      const propertyId = 'prop-123';
      const files = [
        new File(['test'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test'], 'image2.jpg', { type: 'image/jpeg' })
      ];

      const storageBuilder = {
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null })
      };

      mockSupabase.storage.from.mockReturnValue(storageBuilder);

      const result = await propertyRepository.uploadImages(propertyId, files);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('properties');
      expect(storageBuilder.upload).toHaveBeenCalledTimes(2);
    });

    it('should handle upload errors', async () => {
      const propertyId = 'prop-123';
      const files = [new File(['test'], 'image1.jpg', { type: 'image/jpeg' })];

      const storageBuilder = {
        upload: vi.fn().mockResolvedValue({ data: null, error: new Error('Upload failed') })
      };

      mockSupabase.storage.from.mockReturnValue(storageBuilder);

      const result = await propertyRepository.uploadImages(propertyId, files);

      expect(result).toHaveProperty('error');
    });
  });
});