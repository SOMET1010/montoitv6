import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadService } from '../upload/uploadService';

// Mock Supabase
const mockSupabase = {
  storage: {
    from: vi.fn()
  }
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('Upload Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property Images Upload', () => {
    it('should upload property images successfully', async () => {
      const propertyId = 'prop-123';
      const files = [
        new File(['test'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test'], 'image2.png', { type: 'image/png' })
      ];

      const mockStorageBuilder = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'properties/prop-123/image1.jpg' },
          error: null
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = await uploadService.uploadPropertyImages(propertyId, files);

      expect(result.success).toBe(true);
      expect(result.paths).toHaveLength(2);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('properties');
      expect(mockStorageBuilder.upload).toHaveBeenCalledTimes(2);
    });

    it('should handle file validation errors', async () => {
      const propertyId = 'prop-123';
      const invalidFiles = [
        new File(['test'], 'document.pdf', { type: 'application/pdf' }),
        new File([''], 'empty.jpg', { type: 'image/jpeg' })
      ];

      const result = await uploadService.uploadPropertyImages(propertyId, invalidFiles);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Format de fichier invalide');
      expect(result.errors).toContain('Le fichier est vide');
    });

    it('should handle oversized files', async () => {
      const propertyId = 'prop-123';
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      const result = await uploadService.uploadPropertyImages(propertyId, [largeFile]);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('trop volumineux'))).toBe(true);
    });

    it('should generate unique filenames', async () => {
      const propertyId = 'prop-123';
      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' });

      const mockStorageBuilder = {
        upload: vi.fn().mockResolvedValue({
          data: { path: expect.stringMatching(/^properties\/prop-123\/image_\d+\.jpg$/) },
          error: null
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      await uploadService.uploadPropertyImages(propertyId, [file]);

      expect(mockStorageBuilder.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^properties\/prop-123\/image_\d+\.jpg$/),
        file,
        expect.objectContaining({
          contentType: 'image/jpeg',
          upsert: false
        })
      );
    });

    it('should handle upload errors', async () => {
      const propertyId = 'prop-123';
      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' });

      const mockStorageBuilder = {
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Upload failed')
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = await uploadService.uploadPropertyImages(propertyId, [file]);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Upload failed');
    });
  });

  describe('Profile Picture Upload', () => {
    it('should upload profile picture successfully', async () => {
      const userId = 'user-123';
      const file = new File(['test'], 'profile.jpg', { type: 'image/jpeg' });

      const mockStorageBuilder = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'profiles/user-123/profile.jpg' },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/profiles/user-123/profile.jpg' }
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = await uploadService.uploadProfilePicture(userId, file);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/profiles/user-123/profile.jpg');
      expect(mockStorageBuilder.upload).toHaveBeenCalledWith(
        'profiles/user-123/profile.jpg',
        file,
        expect.objectContaining({
          contentType: 'image/jpeg',
          upsert: true
        })
      );
    });

    it('should validate profile picture format', async () => {
      const userId = 'user-123';
      const invalidFile = new File(['test'], 'profile.pdf', { type: 'application/pdf' });

      const result = await uploadService.uploadProfilePicture(userId, invalidFile);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('image'))).toBe(true);
    });

    it('should validate profile picture size', async () => {
      const userId = 'user-123';
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'profile.jpg', {
        type: 'image/jpeg'
      });

      const result = await uploadService.uploadProfilePicture(userId, largeFile);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('volumineux'))).toBe(true);
    });
  });

  describe('Document Upload', () => {
    it('should upload documents successfully', async () => {
      const userId = 'user-123';
      const documentType = 'id_card';
      const file = new File(['test'], 'id-card.pdf', { type: 'application/pdf' });

      const mockStorageBuilder = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'documents/user-123/id-card.pdf' },
          error: null
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = await uploadService.uploadDocument(userId, documentType, file);

      expect(result.success).toBe(true);
      expect(result.path).toBe('documents/user-123/id-card.pdf');
      expect(mockStorageBuilder.upload).toHaveBeenCalledWith(
        'documents/user-123/id-card.pdf',
        file,
        expect.objectContaining({
          contentType: 'application/pdf',
          upsert: false
        })
      );
    });

    it('should validate document types', async () => {
      const userId = 'user-123';
      const invalidDocumentType = 'invalid_type';
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });

      const result = await uploadService.uploadDocument(userId, invalidDocumentType, file);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Type de document'))).toBe(true);
    });

    it('should accept multiple document formats', async () => {
      const userId = 'user-123';
      const documentType = 'proof_of_income';
      const validFormats = [
        new File(['test'], 'proof.pdf', { type: 'application/pdf' }),
        new File(['test'], 'proof.jpg', { type: 'image/jpeg' }),
        new File(['test'], 'proof.png', { type: 'image/png' })
      ];

      const mockStorageBuilder = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'documents/user-123/proof-of-income.pdf' },
          error: null
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      for (const file of validFormats) {
        const result = await uploadService.uploadDocument(userId, documentType, file);
        expect(result.success).toBe(true);
      }
    });

    it('should handle document size limits', async () => {
      const userId = 'user-123';
      const documentType = 'proof_of_income';
      const largeDocument = new File(['x'.repeat(11 * 1024 * 1024)], 'proof.pdf', {
        type: 'application/pdf'
      });

      const result = await uploadService.uploadDocument(userId, documentType, largeDocument);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('volumineux'))).toBe(true);
    });
  });

  describe('File Management', () => {
    it('should delete files successfully', async () => {
      const bucket = 'properties';
      const filePath = 'prop-123/image1.jpg';

      const mockStorageBuilder = {
        remove: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = await uploadService.deleteFile(bucket, filePath);

      expect(result.success).toBe(true);
      expect(mockStorageBuilder.remove).toHaveBeenCalledWith([filePath]);
    });

    it('should handle delete errors', async () => {
      const bucket = 'properties';
      const filePath = 'nonexistent.jpg';

      const mockStorageBuilder = {
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('File not found')
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = await uploadService.deleteFile(bucket, filePath);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('File not found');
    });

    it('should get public URL for files', () => {
      const bucket = 'properties';
      const filePath = 'prop-123/image1.jpg';
      const expectedUrl = 'https://example.com/properties/prop-123/image1.jpg';

      const mockStorageBuilder = {
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: expectedUrl }
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = uploadService.getPublicUrl(bucket, filePath);

      expect(result).toBe(expectedUrl);
      expect(mockStorageBuilder.getPublicUrl).toHaveBeenCalledWith(filePath);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch upload', async () => {
      const propertyId = 'prop-123';
      const files = [
        new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'image2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'image3.jpg', { type: 'image/jpeg' })
      ];

      const mockStorageBuilder = {
        upload: vi.fn()
          .mockResolvedValueOnce({
            data: { path: 'properties/prop-123/image1.jpg' },
            error: null
          })
          .mockResolvedValueOnce({
            data: { path: 'properties/prop-123/image2.jpg' },
            error: null
          })
          .mockResolvedValueOnce({
            data: { path: 'properties/prop-123/image3.jpg' },
            error: null
          })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = await uploadService.uploadPropertyImages(propertyId, files);

      expect(result.success).toBe(true);
      expect(result.paths).toHaveLength(3);
      expect(mockStorageBuilder.upload).toHaveBeenCalledTimes(3);
    });

    it('should handle partial batch upload failures', async () => {
      const propertyId = 'prop-123';
      const files = [
        new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'image2.jpg', { type: 'image/jpeg' })
      ];

      const mockStorageBuilder = {
        upload: vi.fn()
          .mockResolvedValueOnce({
            data: { path: 'properties/prop-123/image1.jpg' },
            error: null
          })
          .mockResolvedValueOnce({
            data: null,
            error: new Error('Upload failed')
          })
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageBuilder);

      const result = await uploadService.uploadPropertyImages(propertyId, files);

      expect(result.success).toBe(false);
      expect(result.paths).toHaveLength(1);
      expect(result.errors).toContain('Upload failed');
    });
  });
});