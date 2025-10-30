import { supabase } from '../lib/supabase';
import { ContractPdfGenerator, ContractData } from './contracts/contractPdfGenerator';

export const contractService = {
  async generateContract(data: ContractData): Promise<Blob> {
    const generator = new ContractPdfGenerator();
    return generator.generate(data);
  },

  async saveContract(leaseId: string, blob: Blob): Promise<string> {
    const fileName = `${leaseId}/contract_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  },

  async generateAndSaveContract(leaseId: string): Promise<string> {
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select(`
        *,
        property:properties(title, address, city),
        landlord:profiles!leases_landlord_id_fkey(full_name, phone, email),
        tenant:profiles!leases_tenant_id_fkey(full_name, phone, email)
      `)
      .eq('id', leaseId)
      .single();

    if (leaseError || !lease) {
      throw new Error('Bail introuvable');
    }

    const contractData: ContractData = {
      leaseId,
      propertyTitle: lease.property?.title || 'Propriété',
      propertyAddress: lease.property?.address || '',
      propertyCity: lease.property?.city || '',
      landlordName: lease.landlord?.full_name || 'Propriétaire',
      landlordPhone: lease.landlord?.phone || '',
      landlordEmail: lease.landlord?.email || '',
      tenantName: lease.tenant?.full_name || 'Locataire',
      tenantPhone: lease.tenant?.phone || '',
      tenantEmail: lease.tenant?.email || '',
      monthlyRent: lease.monthly_rent || 0,
      depositAmount: lease.deposit_amount || 0,
      chargesAmount: lease.charges_amount || 0,
      startDate: lease.start_date,
      endDate: lease.end_date,
      paymentDay: lease.payment_day || 1,
      customClauses: lease.custom_clauses || undefined
    };

    const pdfBlob = await this.generateContract(contractData);
    const contractUrl = await this.saveContract(leaseId, pdfBlob);

    await supabase
      .from('leases')
      .update({ pdf_document_url: contractUrl })
      .eq('id', leaseId);

    return contractUrl;
  },

  downloadContract(blob: Blob, fileName: string = 'contrat-bail.pdf') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
