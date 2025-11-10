import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Shield, CheckCircle, AlertCircle, Lock, Loader, Download } from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
import AnsutBadge from '../../components/AnsutBadge';

interface Lease {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  monthly_rent: number;
  deposit_amount: number;
  charges_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  pdf_document_url: string;
  signed_pdf_url: string;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
  tenant_otp_verified_at: string | null;
  landlord_otp_verified_at: string | null;
  custom_clauses: string | null;
  payment_day: number;
}

interface Property {
  title: string;
  address: string;
  city: string;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  ansut_certified: boolean;
}

export default function SignLease() {
  const { user, profile } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [landlordProfile, setLandlordProfile] = useState<UserProfile | null>(null);
  const [tenantProfile, setTenantProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const leaseId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (user && leaseId) {
      loadLeaseData();
    }
  }, [user, leaseId]);

  const loadLeaseData = async () => {
    try {
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', leaseId)
        .single();

      if (leaseError) throw leaseError;

      if (leaseData.landlord_id !== user?.id && leaseData.tenant_id !== user?.id) {
        setError('Vous n\'êtes pas autorisé à accéder à ce bail');
        return;
      }

      setLease(leaseData);

      const [propertyRes, landlordRes, tenantRes] = await Promise.all([
        supabase
          .from('properties')
          .select('title, address, city')
          .eq('id', leaseData.property_id)
          .single(),
        supabase
          .from('profiles')
          .select('full_name, email, phone, ansut_certified')
          .eq('id', leaseData.landlord_id)
          .single(),
        supabase
          .from('profiles')
          .select('full_name, email, phone, ansut_certified')
          .eq('id', leaseData.tenant_id)
          .single()
      ]);

      if (propertyRes.data) setProperty(propertyRes.data);
      if (landlordRes.data) setLandlordProfile(landlordRes.data);
      if (tenantRes.data) setTenantProfile(tenantRes.data);

    } catch (err: any) {
      console.error('Error loading lease:', err);
      setError(err.message || 'Erreur lors du chargement du bail');
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async () => {
    if (!profile?.ansut_certified) {
      setError('Vous devez être certifié ANSUT pour signer un bail');
      return;
    }

    setSendingOTP(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          phoneNumber: profile.phone,
          message: `Votre code OTP pour signer le bail: ${Math.floor(100000 + Math.random() * 900000)}. Valide 5 minutes.`,
          purpose: 'lease_signature'
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'OTP');
      }

      setOtpSent(true);
      setShowOTPModal(true);
      setSuccess('Code OTP envoyé par SMS');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const verifyOTPAndSign = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Veuillez saisir un code OTP valide à 6 chiffres');
      return;
    }

    setVerifyingOTP(true);
    setError('');

    try {
      const verifyResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cryptoneo-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'verify_otp',
          userId: user?.id,
          leaseId: leaseId,
          otpCode: otpCode
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Code OTP invalide ou expiré');
      }

      setSigning(true);

      const signResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cryptoneo-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'sign_document',
          userId: user?.id,
          leaseId: leaseId,
          documentUrl: lease?.pdf_document_url
        })
      });

      if (!signResponse.ok) {
        throw new Error('Erreur lors de la signature du document');
      }

      const signResult = await signResponse.json();

      setSuccess('✅ Bail signé avec succès!');
      setShowOTPModal(false);

      const isLandlord = lease?.landlord_id === user?.id;
      const isTenant = lease?.tenant_id === user?.id;

      if (isTenant && !lease?.landlord_signed_at) {
        await sendNotificationToLandlord();
      } else if (isLandlord && lease?.tenant_signed_at) {
        await sendFinalConfirmationEmails();
      }

      setTimeout(() => {
        window.location.href = `/contrat/${leaseId}`;
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la signature');
    } finally {
      setVerifyingOTP(false);
      setSigning(false);
    }
  };

  const sendNotificationToLandlord = async () => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: landlordProfile?.email,
          subject: 'Bail signé par le locataire - Action requise',
          template: 'lease-tenant-signed',
          data: {
            landlordName: landlordProfile?.full_name,
            tenantName: tenantProfile?.full_name,
            propertyTitle: property?.title,
            leaseLink: `${window.location.origin}/signer-bail/${leaseId}`
          }
        })
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const sendFinalConfirmationEmails = async () => {
    try {
      await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            to: landlordProfile?.email,
            subject: 'Bail entièrement signé',
            template: 'lease-fully-signed',
            data: {
              recipientName: landlordProfile?.full_name,
              propertyTitle: property?.title
            }
          })
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            to: tenantProfile?.email,
            subject: 'Bail entièrement signé',
            template: 'lease-fully-signed',
            data: {
              recipientName: tenantProfile?.full_name,
              propertyTitle: property?.title
            }
          })
        })
      ]);
    } catch (err) {
      console.error('Error sending confirmation emails:', err);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600">
              Veuillez vous connecter pour signer le bail
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader className="w-12 h-12 text-terracotta-500 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  if (!lease || !property) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Bail introuvable
            </h2>
            <p className="text-gray-600">{error || 'Le bail demandé n\'existe pas'}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isLandlord = lease.landlord_id === user.id;
  const isTenant = lease.tenant_id === user.id;
  const hasUserSigned = isLandlord ? lease.landlord_signed_at : lease.tenant_signed_at;
  const otherPartySigned = isLandlord ? lease.tenant_signed_at : lease.landlord_signed_at;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-10 h-10 text-terracotta-600" />
              <h1 className="text-4xl font-bold text-gradient">Signature Électronique du Bail</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Signature sécurisée avec certification ANSUT et horodatage CryptoNeo
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3 mb-6">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {!profile?.ansut_certified && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
              <div className="flex items-start space-x-4">
                <Shield className="w-8 h-8 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-2">Certification ANSUT requise</h3>
                  <p className="text-amber-800 mb-4">
                    Vous devez être certifié ANSUT pour signer électroniquement un bail.
                  </p>
                  <a
                    href="/certification-ansut"
                    className="btn-primary inline-block"
                  >
                    Obtenir la certification
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Détails du Bail</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-bold text-gray-700 mb-2">Propriété</h3>
                <p className="text-gray-900">{property.title}</p>
                <p className="text-sm text-gray-600">{property.address}, {property.city}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-2">Durée du bail</h3>
                <p className="text-gray-900">
                  Du {new Date(lease.start_date).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-gray-900">
                  Au {new Date(lease.end_date).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-2 flex items-center space-x-2">
                  <span>Bailleur</span>
                  {landlordProfile?.ansut_certified && <AnsutBadge certified={true} size="small" />}
                </h3>
                <p className="text-gray-900">{landlordProfile?.full_name}</p>
                <p className="text-sm text-gray-600">{landlordProfile?.email}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-2 flex items-center space-x-2">
                  <span>Locataire</span>
                  {tenantProfile?.ansut_certified && <AnsutBadge certified={true} size="small" />}
                </h3>
                <p className="text-gray-900">{tenantProfile?.full_name}</p>
                <p className="text-sm text-gray-600">{tenantProfile?.email}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-terracotta-50 to-coral-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Montants</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Loyer mensuel</p>
                  <p className="text-xl font-bold text-terracotta-700">
                    {lease.monthly_rent.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Charges</p>
                  <p className="text-xl font-bold text-terracotta-700">
                    {lease.charges_amount.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dépôt de garantie</p>
                  <p className="text-xl font-bold text-terracotta-700">
                    {lease.deposit_amount.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de paiement</p>
                  <p className="text-xl font-bold text-terracotta-700">
                    Le {lease.payment_day} du mois
                  </p>
                </div>
              </div>
            </div>

            {lease.pdf_document_url && (
              <div className="mb-6">
                <a
                  href={lease.pdf_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center justify-center space-x-2 w-full"
                >
                  <Download className="w-5 h-5" />
                  <span>Télécharger le PDF du bail</span>
                </a>
              </div>
            )}

            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="font-bold text-gray-900 mb-4">Statut des signatures</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Locataire</span>
                  {lease.tenant_signed_at ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold">Signé le {new Date(lease.tenant_signed_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  ) : (
                    <span className="text-amber-600 font-bold">En attente</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Bailleur</span>
                  {lease.landlord_signed_at ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold">Signé le {new Date(lease.landlord_signed_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  ) : (
                    <span className="text-amber-600 font-bold">En attente</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!hasUserSigned && profile?.ansut_certified && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center">
                <Shield className="w-16 h-16 text-terracotta-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Prêt à signer électroniquement?
                </h3>
                <p className="text-gray-600 mb-6">
                  {isLandlord
                    ? 'En signant ce bail, vous confirmez les termes et conditions énoncés.'
                    : 'En signant ce bail, vous vous engagez à respecter toutes les clauses du contrat.'}
                </p>
                <button
                  onClick={requestOTP}
                  disabled={sendingOTP}
                  className="btn-primary py-3 px-8 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
                >
                  {sendingOTP ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Envoi OTP...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Signer le bail</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {hasUserSigned && !otherPartySigned && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900 mb-2">Vous avez signé ce bail</h3>
                  <p className="text-green-700">
                    En attente de la signature de {isLandlord ? 'le locataire' : 'le bailleur'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {lease.status === 'actif' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900 mb-2">Bail entièrement signé!</h3>
                  <p className="text-green-700 mb-4">
                    Le bail est maintenant actif et juridiquement contraignant.
                  </p>
                  {lease.signed_pdf_url && (
                    <a
                      href={lease.signed_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Télécharger le bail signé</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showOTPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Vérification OTP</h3>
            <p className="text-gray-600 mb-6">
              Un code à 6 chiffres a été envoyé par SMS à votre numéro de téléphone.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Code OTP
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 text-center text-2xl tracking-widest"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowOTPModal(false);
                  setOtpCode('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold"
                disabled={verifyingOTP || signing}
              >
                Annuler
              </button>
              <button
                onClick={verifyOTPAndSign}
                disabled={verifyingOTP || signing || otpCode.length !== 6}
                className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {verifyingOTP || signing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Signature...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Vérifier et signer</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Le code OTP est valide pendant 5 minutes
            </p>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
