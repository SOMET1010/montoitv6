import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

interface CertificateData {
  userId: string;
  fullName: string;
  certificationLevel: string;
  certificationNumber: string;
  totalScore: number;
  certifiedAt: string;
  expiresAt: string;
  identityScore: number;
  paymentScore: number;
  profileScore: number;
  engagementScore: number;
  reputationScore: number;
  tenureScore: number;
}

export const certificateService = {
  async generateCertificate(data: CertificateData): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(245, 242, 235);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(78, 70, 55);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

    doc.setFillColor(212, 163, 115);
    doc.rect(10, 20, pageWidth - 20, pageHeight - 40, 'S');
    doc.setLineWidth(1);
    doc.setDrawColor(78, 70, 55);
    doc.rect(12, 22, pageWidth - 24, pageHeight - 44, 'S');

    doc.setTextColor(78, 70, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉPUBLIQUE DE CÔTE D\'IVOIRE', pageWidth / 2, 10, { align: 'center' });

    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICAT ANSUT', pageWidth / 2, 45, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Agence Nationale des Services Universels de Télécommunications', pageWidth / 2, 55, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.setDrawColor(212, 163, 115);
    doc.line(50, 60, pageWidth - 50, 60);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Délivré à', pageWidth / 2, 72, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(184, 115, 51);
    doc.text(data.fullName.toUpperCase(), pageWidth / 2, 85, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(78, 70, 55);
    doc.text('Locataire Certifié - Niveau ' + data.certificationLevel.toUpperCase(), pageWidth / 2, 95, { align: 'center' });

    const boxWidth = 50;
    const boxHeight = 45;
    const boxX = (pageWidth - boxWidth) / 2;
    const boxY = 105;

    doc.setFillColor(78, 70, 55);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'FD');

    doc.setFontSize(48);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(Math.round(data.totalScore).toString(), pageWidth / 2, boxY + 25, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Score Global', pageWidth / 2, boxY + 35, { align:'center' });

    const criteriaY = 160;
    const criteriaSpacing = 35;
    const criteria = [
      { name: 'Identité', score: data.identityScore, max: 20 },
      { name: 'Paiements', score: data.paymentScore, max: 25 },
      { name: 'Profil', score: data.profileScore, max: 15 },
      { name: 'Engagement', score: data.engagementScore, max: 15 },
      { name: 'Réputation', score: data.reputationScore, max: 15 },
      { name: 'Ancienneté', score: data.tenureScore, max: 10 }
    ];

    doc.setFontSize(10);
    doc.setTextColor(78, 70, 55);
    criteria.forEach((criterion, index) => {
      const x = 30 + (index * criteriaSpacing);
      doc.text(criterion.name, x, criteriaY);
      doc.text(`${Math.round(criterion.score)}/${criterion.max}`, x, criteriaY + 5);
    });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const certDate = new Date(data.certifiedAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const expDate = new Date(data.expiresAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.text(`Numéro de certificat: ${data.certificationNumber}`, 30, 180);
    doc.text(`Date de délivrance: ${certDate}`, 30, 185);
    doc.text(`Valide jusqu'au: ${expDate}`, 30, 190);

    doc.setFontSize(8);
    doc.text('Vérifiable sur montoit.ansut.ci', pageWidth - 30, 185, { align: 'right' });

    return doc.output('blob');
  },

  async saveCertificate(userId: string, blob: Blob): Promise<string> {
    const fileName = `${userId}/certificate_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  },

  async generateAndSaveCertificate(userId: string): Promise<string> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const { data: certification } = await supabase
      .from('ansut_certifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: score } = await supabase
      .from('tenant_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!profile || !certification || !score) {
      throw new Error('Données de certification incomplètes');
    }

    const certificateData: CertificateData = {
      userId,
      fullName: profile.full_name || 'Utilisateur',
      certificationLevel: certification.certification_level,
      certificationNumber: certification.certification_number,
      totalScore: score.total_score,
      certifiedAt: certification.certified_at!,
      expiresAt: certification.expires_at!,
      identityScore: score.identity_score,
      paymentScore: score.payment_score,
      profileScore: score.profile_score,
      engagementScore: score.engagement_score,
      reputationScore: score.reputation_score,
      tenureScore: score.tenure_score
    };

    const pdfBlob = await this.generateCertificate(certificateData);

    const certificateUrl = await this.saveCertificate(userId, pdfBlob);

    await supabase
      .from('ansut_certifications')
      .update({ certificate_url: certificateUrl })
      .eq('user_id', userId);

    return certificateUrl;
  },

  downloadCertificate(blob: Blob, fileName: string = 'certificat-ansut.pdf') {
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
