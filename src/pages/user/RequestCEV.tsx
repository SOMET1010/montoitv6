import React, { useState, useEffect } from 'react';
import {
  Shield,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Home,
  CreditCard,
  Send,
  Info,
} from 'lucide-react';
import { cevService, type CEVPrerequisites } from '../../services/cevService';
import { supabase } from '../../lib/supabase';

export default function RequestCEV() {
  const urlParams = new URLSearchParams(window.location.search);
  const leaseId = urlParams.get('lease_id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [prerequisites, setPrerequisites] = useState<CEVPrerequisites | null>(null);
  const [step, setStep] = useState<'check' | 'upload' | 'review' | 'payment'>('check');

  const [documents, setDocuments] = useState({
    landlord_cni_front: null as File | null,
    landlord_cni_back: null as File | null,
    tenant_cni_front: null as File | null,
    tenant_cni_back: null as File | null,
    property_title: null as File | null,
    property_photo: null as File | null,
    payment_proof: null as File | null,
  });

  const [uploadedUrls, setUploadedUrls] = useState({
    landlord_cni_front_url: '',
    landlord_cni_back_url: '',
    tenant_cni_front_url: '',
    tenant_cni_back_url: '',
    property_title_url: '',
    property_photo_url: '',
    payment_proof_url: '',
    signed_lease_url: '',
  });

  const [leaseData, setLeaseData] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!leaseId) {
      window.location.href = '/mes-contrats';
      return;
    }
    loadPrerequisites();
  }, [leaseId]);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const prereqs = await cevService.checkPrerequisites(leaseId!);
      setPrerequisites(prereqs);

      const { data: lease } = await supabase
        .from('leases')
        .select('*, property:properties(*), landlord:profiles!leases_landlord_id_fkey(*), tenant:profiles!leases_tenant_id_fkey(*)')
        .eq('id', leaseId)
        .single();

      setLeaseData(lease);

      if (lease?.signed_document_url) {
        setUploadedUrls((prev) => ({
          ...prev,
          signed_lease_url: lease.signed_document_url,
        }));
      }

      if (prereqs.valid) {
        setStep('upload');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (key: keyof typeof documents, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [key]: file }));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUploadDocument = async (key: keyof typeof documents) => {
    const file = documents[key];
    if (!file) return;

    try {
      setUploading(key);
      const url = await uploadFile(file, `cev-requests/${leaseId}`);
      setUploadedUrls((prev) => ({
        ...prev,
        [`${key}_url`]: url,
      }));
    } catch (error: any) {
      console.error('Erreur upload:', error);
      alert(`Erreur lors du téléversement: ${error.message}`);
    } finally {
      setUploading(null);
    }
  };

  const canProceedToReview = () => {
    return (
      uploadedUrls.landlord_cni_front_url &&
      uploadedUrls.landlord_cni_back_url &&
      uploadedUrls.tenant_cni_front_url &&
      uploadedUrls.tenant_cni_back_url &&
      uploadedUrls.property_title_url &&
      uploadedUrls.property_photo_url &&
      uploadedUrls.signed_lease_url
    );
  };

  const handleSubmitRequest = async () => {
    if (!canProceedToReview()) {
      alert('Veuillez téléverser tous les documents requis');
      return;
    }

    try {
      setSubmitting(true);

      const requestData = {
        lease_id: leaseId!,
        property_id: leaseData.property_id,
        landlord_id: leaseData.landlord_id,
        tenant_id: leaseData.tenant_id,
        signed_lease_url: uploadedUrls.signed_lease_url,
        landlord_cni_front_url: uploadedUrls.landlord_cni_front_url,
        landlord_cni_back_url: uploadedUrls.landlord_cni_back_url,
        tenant_cni_front_url: uploadedUrls.tenant_cni_front_url,
        tenant_cni_back_url: uploadedUrls.tenant_cni_back_url,
        property_title_url: uploadedUrls.property_title_url,
        property_photo_url: uploadedUrls.property_photo_url,
        payment_proof_url: uploadedUrls.payment_proof_url || undefined,
      };

      const request = await cevService.createCEVRequest(requestData);
      alert('Demande de CEV créée avec succès !');
      window.location.href = `/cev-request/${request.id}`;
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!prerequisites) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Demande de Certificat CEV ONECI
              </h1>
              <p className="text-sm text-gray-600">
                Certification électronique à force légale complète
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                step === 'check' ? 'bg-blue-100 text-blue-800' :
                step === 'upload' ? 'bg-yellow-100 text-yellow-800' :
                step === 'review' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {step === 'check' ? 'Vérification des prérequis' :
                 step === 'upload' ? 'Téléversement des documents' :
                 step === 'review' ? 'Révision' :
                 'Paiement'}
              </span>
            </div>

            <div className="flex gap-2">
              {['check', 'upload', 'review', 'payment'].map((s, index) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full ${
                    ['check', 'upload', 'review', 'payment'].indexOf(step) >= index
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 'check' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Qu'est-ce que le CEV ONECI ?</p>
                    <p>
                      Le Certificat Électronique Validé (CEV) est émis par l'ONECI et confère à
                      votre bail une force légale complète devant les tribunaux ivoiriens. C'est
                      la certification ultime pour sécuriser votre contrat de location.
                    </p>
                  </div>
                </div>
              </div>

              {!prerequisites.valid ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900 mb-2">
                        Prérequis non satisfaits
                      </p>
                      <ul className="space-y-1 text-sm text-red-800">
                        {prerequisites.missing_requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900 mb-1">
                        Tous les prérequis sont satisfaits
                      </p>
                      <p className="text-sm text-green-800">
                        Vous pouvez procéder à la demande de CEV pour ce bail.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Bail</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Statut: {prerequisites.lease?.status}</p>
                    <p>
                      Signé:{' '}
                      {prerequisites.lease?.electronically_signed ? (
                        <CheckCircle className="h-4 w-4 text-green-600 inline" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 inline" />
                      )}
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Propriétaire</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      ANSUT:{' '}
                      {prerequisites.landlord?.ansut_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-600 inline" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 inline" />
                      )}
                    </p>
                    <p>Score: {prerequisites.landlord?.tenant_score || 0}/1000</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Locataire</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      ANSUT:{' '}
                      {prerequisites.tenant?.ansut_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-600 inline" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 inline" />
                      )}
                    </p>
                    <p>Score: {prerequisites.tenant?.tenant_score || 0}/1000</p>
                  </div>
                </div>
              </div>

              {prerequisites.valid && (
                <button
                  onClick={() => setStep('upload')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Commencer la demande
                </button>
              )}
            </div>
          )}

          {step === 'upload' && (
            <div>
              <p className="text-gray-600 mb-6">
                Téléversez tous les documents requis pour votre demande de CEV. Les documents
                doivent être au format PDF, JPG ou PNG et ne pas dépasser 10 MB.
              </p>

              <div className="space-y-4 mb-6">
                {[
                  { key: 'landlord_cni_front', label: 'CNI Propriétaire (Recto)', required: true },
                  { key: 'landlord_cni_back', label: 'CNI Propriétaire (Verso)', required: true },
                  { key: 'tenant_cni_front', label: 'CNI Locataire (Recto)', required: true },
                  { key: 'tenant_cni_back', label: 'CNI Locataire (Verso)', required: true },
                  { key: 'property_title', label: 'Titre de Propriété', required: true },
                  { key: 'property_photo', label: 'Photo du Bien', required: true },
                  { key: 'payment_proof', label: 'Preuve de Paiement Frais CEV', required: false },
                ].map((doc) => {
                  const urlKey = `${doc.key}_url` as keyof typeof uploadedUrls;
                  const isUploaded = !!uploadedUrls[urlKey];

                  return (
                    <div key={doc.key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {doc.label}
                            {doc.required && <span className="text-red-600 ml-1">*</span>}
                          </span>
                        </div>
                        {isUploaded && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      <div className="flex gap-3">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            handleFileChange(
                              doc.key as keyof typeof documents,
                              e.target.files?.[0] || null
                            )
                          }
                          className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <button
                          onClick={() => handleUploadDocument(doc.key as keyof typeof documents)}
                          disabled={
                            !documents[doc.key as keyof typeof documents] ||
                            uploading === doc.key
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {uploading === doc.key ? 'Envoi...' : 'Téléverser'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('check')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep('review')}
                  disabled={!canProceedToReview()}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Réviser
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div>
              <p className="text-gray-600 mb-6">
                Vérifiez que tous les documents sont corrects avant de soumettre votre demande.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Documents soumis</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {Object.entries(uploadedUrls)
                    .filter(([_, url]) => url)
                    .map(([key, url]) => (
                      <li key={key} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="capitalize">
                          {key.replace(/_/g, ' ').replace(' url', '')}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <CreditCard className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-medium mb-1">Frais de certification CEV</p>
                    <p>
                      Les frais de certification CEV sont de 5,000 FCFA. Vous pouvez payer
                      maintenant ou après la soumission de votre demande.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  {submitting ? 'Soumission...' : 'Soumettre la demande'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
