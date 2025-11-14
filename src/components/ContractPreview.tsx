import { useState } from 'react';
import { FileText, Download, Eye, X } from 'lucide-react';
import { generateLeasePDF } from '../utils/pdfGenerator';

interface ContractPreviewProps {
  contractData: {
    id: string;
    contract_number: string;
    property: {
      title: string;
      address: string;
      city: string;
      property_type: string;
      surface_area: number;
      bedrooms: number;
      bathrooms: number;
      description?: string;
    };
    owner: {
      full_name: string;
      email: string;
      phone: string;
      address?: string;
    };
    tenant: {
      full_name: string;
      email: string;
      phone: string;
      address?: string;
      profession?: string;
    };
    monthly_rent: number;
    deposit_amount: number;
    charges_amount: number;
    start_date: string;
    end_date: string;
    payment_day: number;
    custom_clauses?: string;
  };
}

export default function ContractPreview({ contractData }: ContractPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const generateAndDownload = async () => {
    setGeneratingPdf(true);
    try {
      const pdf = generateLeasePDF({
        leaseId: contractData.id,
        contractNumber: contractData.contract_number,
        propertyTitle: contractData.property.title,
        propertyAddress: contractData.property.address,
        propertyCity: contractData.property.city,
        propertyType: contractData.property.property_type,
        surfaceArea: contractData.property.surface_area,
        bedrooms: contractData.property.bedrooms,
        bathrooms: contractData.property.bathrooms,
        propertyDescription: contractData.property.description,
        landlordName: contractData.owner.full_name,
        landlordEmail: contractData.owner.email,
        landlordPhone: contractData.owner.phone,
        landlordAddress: contractData.owner.address,
        tenantName: contractData.tenant.full_name,
        tenantEmail: contractData.tenant.email,
        tenantPhone: contractData.tenant.phone,
        tenantAddress: contractData.tenant.address,
        tenantProfession: contractData.tenant.profession,
        monthlyRent: contractData.monthly_rent,
        depositAmount: contractData.deposit_amount,
        chargesAmount: contractData.charges_amount,
        startDate: contractData.start_date,
        endDate: contractData.end_date,
        paymentDay: contractData.payment_day,
        customClauses: contractData.custom_clauses
      });

      pdf.save(`Contrat_${contractData.contract_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const generatePreview = async () => {
    setGeneratingPdf(true);
    try {
      const pdf = generateLeasePDF({
        leaseId: contractData.id,
        contractNumber: contractData.contract_number,
        propertyTitle: contractData.property.title,
        propertyAddress: contractData.property.address,
        propertyCity: contractData.property.city,
        propertyType: contractData.property.property_type,
        surfaceArea: contractData.property.surface_area,
        bedrooms: contractData.property.bedrooms,
        bathrooms: contractData.property.bathrooms,
        propertyDescription: contractData.property.description,
        landlordName: contractData.owner.full_name,
        landlordEmail: contractData.owner.email,
        landlordPhone: contractData.owner.phone,
        landlordAddress: contractData.owner.address,
        tenantName: contractData.tenant.full_name,
        tenantEmail: contractData.tenant.email,
        tenantPhone: contractData.tenant.phone,
        tenantAddress: contractData.tenant.address,
        tenantProfession: contractData.tenant.profession,
        monthlyRent: contractData.monthly_rent,
        depositAmount: contractData.deposit_amount,
        chargesAmount: contractData.charges_amount,
        startDate: contractData.start_date,
        endDate: contractData.end_date,
        paymentDay: contractData.payment_day,
        customClauses: contractData.custom_clauses
      });

      const pdfDataUri = pdf.output('dataurlstring');
      window.open(pdfDataUri, '_blank');
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Erreur lors de la génération de la prévisualisation');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const calculateDuration = () => {
    const start = new Date(contractData.start_date);
    const end = new Date(contractData.end_date);
    const months = (end.getFullYear() - start.getFullYear()) * 12 +
                   (end.getMonth() - start.getMonth());
    return months;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="w-8 h-8 text-orange-500" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aperçu du contrat</h2>
          <p className="text-sm text-gray-600">Référence: {contractData.contract_number}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Propriétaire (Bailleur)</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Nom:</span> {contractData.owner.full_name}</p>
              <p><span className="font-medium">Email:</span> {contractData.owner.email}</p>
              <p><span className="font-medium">Téléphone:</span> {contractData.owner.phone}</p>
              {contractData.owner.address && (
                <p><span className="font-medium">Adresse:</span> {contractData.owner.address}</p>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Locataire (Preneur)</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Nom:</span> {contractData.tenant.full_name}</p>
              <p><span className="font-medium">Email:</span> {contractData.tenant.email}</p>
              <p><span className="font-medium">Téléphone:</span> {contractData.tenant.phone}</p>
              {contractData.tenant.address && (
                <p><span className="font-medium">Adresse:</span> {contractData.tenant.address}</p>
              )}
              {contractData.tenant.profession && (
                <p><span className="font-medium">Profession:</span> {contractData.tenant.profession}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">Bien loué</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Désignation:</span> {contractData.property.title}</p>
            <p><span className="font-medium">Adresse:</span> {contractData.property.address}, {contractData.property.city}</p>
            <p><span className="font-medium">Type:</span> {contractData.property.property_type}</p>
            <p><span className="font-medium">Superficie:</span> {contractData.property.surface_area} m²</p>
            <p><span className="font-medium">Chambres:</span> {contractData.property.bedrooms} | <span className="font-medium">Salles de bain:</span> {contractData.property.bathrooms}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-3">Conditions financières</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Loyer mensuel:</span> {contractData.monthly_rent.toLocaleString('fr-FR')} FCFA</p>
              <p><span className="font-medium">Charges:</span> {contractData.charges_amount.toLocaleString('fr-FR')} FCFA</p>
              <p><span className="font-medium">Dépôt de garantie:</span> {contractData.deposit_amount.toLocaleString('fr-FR')} FCFA</p>
              <p><span className="font-medium">Jour de paiement:</span> Le {contractData.payment_day} de chaque mois</p>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-gray-900 mb-3">Durée du bail</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Date de début:</span> {new Date(contractData.start_date).toLocaleDateString('fr-FR')}</p>
              <p><span className="font-medium">Date de fin:</span> {new Date(contractData.end_date).toLocaleDateString('fr-FR')}</p>
              <p><span className="font-medium">Durée totale:</span> {calculateDuration()} mois</p>
            </div>
          </div>
        </div>

        {contractData.custom_clauses && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Clauses particulières</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{contractData.custom_clauses}</p>
          </div>
        )}

        <div className="flex items-center justify-center space-x-4 pt-4 border-t">
          <button
            onClick={generatePreview}
            disabled={generatingPdf}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            <Eye className="w-5 h-5" />
            <span>{generatingPdf ? 'Génération...' : 'Prévisualiser'}</span>
          </button>

          <button
            onClick={generateAndDownload}
            disabled={generatingPdf}
            className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>{generatingPdf ? 'Génération...' : 'Télécharger PDF'}</span>
          </button>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-900">
            <span className="font-semibold">Note importante:</span> Ce contrat est conforme au modèle officiel
            de la Côte d'Ivoire et respecte toutes les dispositions du Code Civil Ivoirien. Il sera signé
            électroniquement avec vérification Mon Toit et horodatage sécurisé par CryptoNeo.
          </p>
        </div>
      </div>
    </div>
  );
}
