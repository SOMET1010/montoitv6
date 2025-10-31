import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
  ExternalLink,
  CreditCard,
  Upload,
} from 'lucide-react';
import { cevService, type CEVRequest } from '../services/cevService';

export default function CEVRequestDetail() {
  const pathParts = window.location.pathname.split('/');
  const requestId = pathParts[pathParts.length - 1];

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<CEVRequest | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!requestId) {
      window.location.href = '/mes-contrats';
      return;
    }
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const data = await cevService.getCEVRequestById(requestId);
      if (!data) {
        alert('Demande CEV introuvable');
        window.location.href = '/mes-contrats';
        return;
      }
      setRequest(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!request?.cev_document_url) return;

    try {
      setDownloading(true);
      const blob = await cevService.downloadCEVCertificate(requestId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CEV-${request.cev_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      alert(error.message);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusInfo = (status: CEVRequest['status']) => {
    switch (status) {
      case 'pending_documents':
        return {
          label: 'Documents en attente',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          description: 'Veuillez téléverser tous les documents requis.',
        };
      case 'submitted':
        return {
          label: 'Soumis à ONECI',
          color: 'bg-blue-100 text-blue-800',
          icon: Clock,
          description: 'Votre demande a été soumise à l\'ONECI et est en attente de traitement.',
        };
      case 'under_review':
        return {
          label: 'En révision',
          color: 'bg-purple-100 text-purple-800',
          icon: Clock,
          description: 'L\'ONECI examine actuellement votre demande.',
        };
      case 'documents_requested':
        return {
          label: 'Documents additionnels requis',
          color: 'bg-orange-100 text-orange-800',
          icon: AlertCircle,
          description: 'L\'ONECI demande des documents supplémentaires.',
        };
      case 'approved':
        return {
          label: 'Approuvé',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          description: 'Votre demande a été approuvée. Le certificat CEV est en cours de génération.',
        };
      case 'issued':
        return {
          label: 'CEV émis',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          description: 'Votre Certificat Électronique Validé a été émis avec succès.',
        };
      case 'rejected':
        return {
          label: 'Rejeté',
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          description: 'Votre demande a été rejetée par l\'ONECI.',
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          description: '',
        };
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

  if (!request) {
    return null;
  }

  const statusInfo = getStatusInfo(request.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Demande CEV ONECI</h1>
                <p className="text-sm text-gray-600">
                  Demande créée le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/mes-contrats'}
              className="text-gray-600 hover:text-gray-900"
            >
              Retour
            </button>
          </div>

          <div className="mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.color}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="font-medium">{statusInfo.label}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{statusInfo.description}</p>
          </div>

          {request.status === 'issued' && request.cev_number && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <h2 className="text-lg font-bold text-green-900">
                      Certificat CEV Émis
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-green-700 mb-1">Numéro CEV</p>
                      <p className="font-mono font-bold text-green-900">{request.cev_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 mb-1">Date d'émission</p>
                      <p className="font-medium text-green-900">
                        {new Date(request.cev_issue_date!).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 mb-1">Date d'expiration</p>
                      <p className="font-medium text-green-900">
                        {new Date(request.cev_expiry_date!).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {request.cev_verification_url && (
                      <div>
                        <p className="text-sm text-green-700 mb-1">Vérification en ligne</p>
                        <a
                          href={request.cev_verification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 hover:text-green-900 flex items-center gap-1 text-sm font-medium"
                        >
                          Vérifier sur ONECI.ci
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadCertificate}
                      disabled={downloading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      {downloading ? 'Téléchargement...' : 'Télécharger le CEV'}
                    </button>
                    {request.cev_qr_code && (
                      <button className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors">
                        <QrCode className="h-5 w-5" />
                        Afficher QR Code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {request.status === 'rejected' && request.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 mb-1">Raison du rejet</p>
                  <p className="text-sm text-red-800">{request.rejection_reason}</p>
                  {request.rejection_details && (
                    <pre className="text-xs text-red-700 mt-2 bg-red-100 p-2 rounded">
                      {JSON.stringify(request.rejection_details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {request.status === 'documents_requested' && request.additional_documents_requested && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-orange-900 mb-2">
                    Documents additionnels requis
                  </p>
                  <ul className="text-sm text-orange-800 space-y-1 mb-3">
                    {Array.isArray(request.additional_documents_requested) &&
                      request.additional_documents_requested.map((doc: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-0.5">•</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                  </ul>
                  {request.additional_documents_deadline && (
                    <p className="text-sm text-orange-900 mb-3">
                      <strong>Date limite:</strong>{' '}
                      {new Date(request.additional_documents_deadline).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                  <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors">
                    <Upload className="h-5 w-5" />
                    Téléverser les documents
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Informations de la demande</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className="font-medium text-gray-900">{statusInfo.label}</span>
                </div>
                {request.oneci_reference_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Référence ONECI:</span>
                    <span className="font-mono font-medium text-gray-900">
                      {request.oneci_reference_number}
                    </span>
                  </div>
                )}
                {request.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Soumis le:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(request.submitted_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {request.oneci_review_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Révisé le:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(request.oneci_review_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Frais de certification</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant:</span>
                  <span className="font-bold text-gray-900">
                    {request.cev_fee_amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Statut de paiement:</span>
                  {request.cev_fee_paid ? (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Payé
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600 font-medium">
                      <Clock className="h-4 w-4" />
                      En attente
                    </span>
                  )}
                </div>
                {!request.cev_fee_paid && (
                  <button className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    <CreditCard className="h-5 w-5" />
                    Payer maintenant
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Documents soumis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'CNI Propriétaire (Recto)', url: request.landlord_cni_front_url },
                { label: 'CNI Propriétaire (Verso)', url: request.landlord_cni_back_url },
                { label: 'CNI Locataire (Recto)', url: request.tenant_cni_front_url },
                { label: 'CNI Locataire (Verso)', url: request.tenant_cni_back_url },
                { label: 'Titre de Propriété', url: request.property_title_url },
                { label: 'Photo du Bien', url: request.property_photo_url },
                { label: 'Bail Signé', url: request.signed_lease_url },
                { label: 'Preuve de Paiement', url: request.payment_proof_url },
              ]
                .filter((doc) => doc.url)
                .map((doc) => (
                  <a
                    key={doc.label}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">{doc.label}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                  </a>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
