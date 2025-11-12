import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Validation Service', () => {
  let validationService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Import service dynamically to avoid issues with dependencies
    validationService = require('../validation/validationService').validationService;
  });

  describe('Property Validation', () => {
    describe('validateProperty', () => {
      it('should validate correct property data', async () => {
        const validProperty = {
          title: 'Bel appartement T3 Cocody',
          description: 'Très bel appartement bien situé',
          address: ' Rue des Jardins, Cocody',
          city: 'Abidjan',
          property_type: 'appartement',
          bedrooms: 3,
          bathrooms: 2,
          surface_area: 85,
          monthly_rent: 150000,
          deposit_amount: 300000,
          charges_amount: 25000,
          images: ['image1.jpg', 'image2.jpg'],
          owner_id: 'owner-123'
        };

        const result = await validationService.validateProperty(validProperty);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject property with missing required fields', async () => {
        const invalidProperty = {
          title: '',
          address: ' Rue des Jardins',
          city: 'Abidjan',
          monthly_rent: 150000
        };

        const result = await validationService.validateProperty(invalidProperty);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should reject property with invalid rent amount', async () => {
        const invalidProperty = {
          title: 'Test Property',
          address: 'Test Address',
          city: 'Abidjan',
          property_type: 'appartement',
          monthly_rent: -1000,
          deposit_amount: 200000,
          charges_amount: 25000,
          owner_id: 'owner-123'
        };

        const result = await validationService.validateProperty(invalidProperty);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('loyer'))).toBe(true);
      });

      it('should reject property with invalid surface area', async () => {
        const invalidProperty = {
          title: 'Test Property',
          address: 'Test Address',
          city: 'Abidjan',
          property_type: 'appartement',
          surface_area: -50,
          monthly_rent: 150000,
          owner_id: 'owner-123'
        };

        const result = await validationService.validateProperty(invalidProperty);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('surface'))).toBe(true);
      });

      it('should validate room counts', async () => {
        const propertyWithInvalidRooms = {
          title: 'Test Property',
          address: 'Test Address',
          city: 'Abidjan',
          property_type: 'appartement',
          bedrooms: -1,
          bathrooms: 0,
          surface_area: 85,
          monthly_rent: 150000,
          owner_id: 'owner-123'
        };

        const result = await validationService.validateProperty(propertyWithInvalidRooms);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('chambre'))).toBe(true);
      });
    });

    describe('validatePropertyImages', () => {
      it('should validate correct images', () => {
        const validImages = [
          { name: 'image1.jpg', type: 'image/jpeg', size: 1024 * 1024 },
          { name: 'image2.png', type: 'image/png', size: 2 * 1024 * 1024 },
          { name: 'image3.webp', type: 'image/webp', size: 500 * 1024 }
        ];

        const result = validationService.validatePropertyImages(validImages);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid file types', () => {
        const invalidImages = [
          { name: 'document.pdf', type: 'application/pdf', size: 1024 * 1024 },
          { name: 'video.mp4', type: 'video/mp4', size: 5 * 1024 * 1024 }
        ];

        const result = validationService.validatePropertyImages(invalidImages);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('format'))).toBe(true);
      });

      it('should reject oversized files', () => {
        const oversizedImages = [
          { name: 'huge.jpg', type: 'image/jpeg', size: 10 * 1024 * 1024 }
        ];

        const result = validationService.validatePropertyImages(oversizedImages);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('taille'))).toBe(true);
      });

      it('require minimum number of images', () => {
        const result = validationService.validatePropertyImages([]);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('minimum'))).toBe(true);
      });
    });
  });

  describe('User Validation', () => {
    describe('validateUserProfile', () => {
      it('should validate complete user profile', async () => {
        const validProfile = {
          full_name: 'Konan Patrice',
          email: 'konan@example.com',
          phone: '+2250712345678',
          user_type: 'locataire',
          city: 'Abidjan',
          bio: 'Je suis un locataire sérieux'
        };

        const result = await validationService.validateUserProfile(validProfile);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate email format', async () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@',
          'test..test@example.com'
        ];

        for (const email of invalidEmails) {
          const profile = {
            full_name: 'Test User',
            email,
            phone: '+2250712345678',
            user_type: 'locataire',
            city: 'Abidjan'
          };

          const result = await validationService.validateUserProfile(profile);
          expect(result.isValid).toBe(false);
          expect(result.errors.some((e: string) => e.includes('email'))).toBe(true);
        }
      });

      it('should validate phone number format', async () => {
        const invalidPhones = [
          '071234567', // Too short
          '07123456789', // Too long
          '0812345678', // Invalid prefix
          'abcdefghij' // Not numbers
        ];

        for (const phone of invalidPhones) {
          const profile = {
            full_name: 'Test User',
            email: 'test@example.com',
            phone,
            user_type: 'locataire',
            city: 'Abidjan'
          };

          const result = await validationService.validateUserProfile(profile);
          expect(result.isValid).toBe(false);
          expect(result.errors.some((e: string) => e.includes('téléphone'))).toBe(true);
        }
      });

      it('should validate user type', async () => {
        const profile = {
          full_name: 'Test User',
          email: 'test@example.com',
          phone: '+2250712345678',
          user_type: 'invalid_type',
          city: 'Abidjan'
        };

        const result = await validationService.validateUserProfile(profile);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('type'))).toBe(true);
      });
    });
  });

  describe('Application Validation', () => {
    describe('validateApplication', () => {
      it('should validate complete application', async () => {
        const validApplication = {
          property_id: 'prop-123',
          tenant_id: 'tenant-123',
          message: 'Je suis très intéressé par cette propriété',
          proposed_rent: 150000,
          proposed_move_in_date: '2024-01-01',
          documents: ['id-card.pdf', 'proof-of-income.pdf']
        };

        const result = await validationService.validateApplication(validApplication);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate required fields', async () => {
        const incompleteApplication = {
          property_id: 'prop-123',
          tenant_id: ''
        };

        const result = await validationService.validateApplication(incompleteApplication);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should validate proposed rent', async () => {
        const invalidApplication = {
          property_id: 'prop-123',
          tenant_id: 'tenant-123',
          proposed_rent: -1000
        };

        const result = await validationService.validateApplication(invalidApplication);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('loyer'))).toBe(true);
      });

      it('should validate move-in date format', async () => {
        const invalidApplication = {
          property_id: 'prop-123',
          tenant_id: 'tenant-123',
          proposed_move_in_date: 'invalid-date'
        };

        const result = await validationService.validateApplication(invalidApplication);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('date'))).toBe(true);
      });
    });
  });

  describe('Lease Validation', () => {
    describe('validateLease', () => {
      it('should validate complete lease', async () => {
        const validLease = {
          property_id: 'prop-123',
          tenant_id: 'tenant-123',
          landlord_id: 'landlord-123',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          monthly_rent: 150000,
          deposit_amount: 300000,
          charges_amount: 25000,
          terms: 'Terms and conditions...'
        };

        const result = await validationService.validateLease(validLease);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate date logic', async () => {
        const invalidLease = {
          property_id: 'prop-123',
          tenant_id: 'tenant-123',
          landlord_id: 'landlord-123',
          start_date: '2024-12-31',
          end_date: '2024-01-01', // End before start
          monthly_rent: 150000,
          deposit_amount: 300000
        };

        const result = await validationService.validateLease(invalidLease);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('date'))).toBe(true);
      });

      it('should validate lease duration', async () => {
        const tooShortLease = {
          property_id: 'prop-123',
          tenant_id: 'tenant-123',
          landlord_id: 'landlord-123',
          start_date: '2024-01-01',
          end_date: '2024-01-15', // Only 2 weeks
          monthly_rent: 150000
        };

        const result = await validationService.validateLease(tooShortLease);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('durée'))).toBe(true);
      });
    });
  });

  describe('Payment Validation', () => {
    describe('validatePayment', () => {
      it('should validate correct payment data', async () => {
        const validPayment = {
          amount: 150000,
          payment_method: 'mobile_money',
          provider: 'orange_money',
          phone_number: '+2250712345678',
          payment_type: 'loyer'
        };

        const result = await validationService.validatePayment(validPayment);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate amount is positive', async () => {
        const invalidPayment = {
          amount: -1000,
          payment_method: 'mobile_money',
          provider: 'orange_money',
          phone_number: '+2250712345678'
        };

        const result = await validationService.validatePayment(invalidPayment);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('montant'))).toBe(true);
      });

      it('should validate payment method', async () => {
        const invalidPayment = {
          amount: 150000,
          payment_method: 'invalid_method',
          phone_number: '+2250712345678'
        };

        const result = await validationService.validatePayment(invalidPayment);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('méthode'))).toBe(true);
      });

      it('should require phone for mobile money payments', async () => {
        const paymentWithoutPhone = {
          amount: 150000,
          payment_method: 'mobile_money',
          provider: 'orange_money'
        };

        const result = await validationService.validatePayment(paymentWithoutPhone);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('téléphone'))).toBe(true);
      });
    });
  });

  describe('Input Sanitization', () => {
    describe('sanitizeInput', () => {
      it('should remove HTML tags', () => {
        const input = '<script>alert("xss")</script>Hello World';
        const result = validationService.sanitizeInput(input);
        expect(result).not.toContain('<script>');
        expect(result).toContain('Hello World');
      });

      it('should trim whitespace', () => {
        const input = '  Hello World  ';
        const result = validationService.sanitizeInput(input);
        expect(result).toBe('Hello World');
      });

      it('should handle empty input', () => {
        const result = validationService.sanitizeInput('');
        expect(result).toBe('');
      });

      it('should handle null/undefined input', () => {
        const result1 = validationService.sanitizeInput(null as any);
        const result2 = validationService.sanitizeInput(undefined as any);
        expect(result1).toBe('');
        expect(result2).toBe('');
      });
    });
  });
});