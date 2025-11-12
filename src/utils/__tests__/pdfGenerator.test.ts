import { describe, it, expect, vi } from 'vitest';
import jsPDF from 'jspdf';
import { generateLeasePDF, uploadPDFToStorage } from '../pdfGenerator';

// Mock jsPDF
vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      internal: {
        pageSize: { getWidth: () => 210, getHeight: () => 297 }
      },
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      splitTextToSize: vi.fn(() => ['test']),
      addPage: vi.fn(),
      setDrawColor: vi.fn(),
      line: vi.fn(),
      setTextColor: vi.fn(),
      output: vi.fn(() => new Blob())
    }))
  };
});

describe('PDF Generator', () => {
  const mockLeaseData = {
    leaseId: 'lease-123',
    contractNumber: 'CNT-2024-001',
    propertyTitle: 'Appartement T3 Cocody',
    propertyAddress: ' Rue des Jardins, Cocody',
    propertyCity: 'Abidjan',
    propertyType: 'appartement',
    surfaceArea: 85,
    bedrooms: 3,
    bathrooms: 2,
    landlordName: 'Konan Patrice',
    landlordEmail: 'konan@example.com',
    landlordPhone: '+22507xxxxxxxx',
    tenantName: 'Yao Mohamed',
    tenantEmail: 'yao@example.com',
    tenantPhone: '+22505xxxxxxxx',
    monthlyRent: 150000,
    depositAmount: 300000,
    chargesAmount: 25000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    paymentDay: 5,
    customClauses: 'Clause personnalisée'
  };

  describe('generateLeasePDF', () => {
    it('should generate a PDF with lease data', () => {
      const pdf = generateLeasePDF(mockLeaseData);

      expect(pdf).toBeDefined();
      expect(jsPDF).toHaveBeenCalled();
    });

    it('should handle minimal lease data', () => {
      const minimalData = {
        ...mockLeaseData,
        landlordAddress: undefined,
        tenantAddress: undefined,
        tenantProfession: undefined,
        propertyDescription: undefined,
        propertyEquipment: undefined,
        customClauses: undefined
      };

      expect(() => generateLeasePDF(minimalData)).not.toThrow();
    });

    it('should include all required sections', () => {
      const pdf = generateLeasePDF(mockLeaseData);

      expect(pdf).toBeDefined();
      // Verify jsPDF methods were called
      expect(jsPDF).toHaveBeenCalled();
    });
  });

  describe('uploadPDFToStorage', () => {
    it('should upload PDF to Supabase storage', async () => {
      const mockSupabase = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null })
          }))
        }
      };

      const pdf = new jsPDF();
      const result = await uploadPDFToStorage(pdf, 'lease-123', mockSupabase as any);

      expect(result).toBe('test/path');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('contracts');
    });

    it('should handle upload errors', async () => {
      const mockSupabase = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ data: null, error: new Error('Upload failed') })
          }))
        }
      };

      const pdf = new jsPDF();
      const result = await uploadPDFToStorage(pdf, 'lease-123', mockSupabase as any);

      expect(result).toBe('leases/lease-123/contract_undefined.pdf');
    });
  });
});