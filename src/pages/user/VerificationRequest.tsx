import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Shield, Upload, CheckCircle, XCircle, Clock, AlertCircle, FileText, Camera, Loader } from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
import { apiKeyService } from '../../services/apiKeyService';

interface VerificationData {
  id: string;
  user_id: string;
  oneci_status: 'en_attente' | 'verifie' | 'rejete';
  cnam_status: 'en_attente' | 'verifie' | 'rejete';
  oneci_document_url: string | null;
  cnam_document_url: string | null;
  oneci_number: string | null;
  cnam_number: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export default function VerificationRequest() {
  const { user, profile } = useAuth();
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [oneciNumber, setOneciNumber] = useState('');
  const [cnamNumber, setCnamNumber] = useState('');
  const [oneciFile, setOneciFile] = useState<File | null>(null);
  const [cnamFile, setCnamFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [verifyingONECI, setVerifyingONECI] = useState(false);
  const [verifyingCNAM, setVerifyingCNAM] = useState(false);

  useEffect(() => {
    if (user) {
      loadVerificationData();
    }
  }, [user]);

  const loadVerificationData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setVerification(data);
        setOneciNumber(data.oneci_number || '');
        setCnamNumber(data.cnam_number || '');
      }
    } catch (err: any) {
      console.error('Error loading verification:', err);
      setError('Erreur lors du chargement des données de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'oneci' | 'cnam') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5 MB');
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Seuls les fichiers image et PDF sont acceptés');
      return;
    }

    if (type === 'oneci') {
      setOneciFile(file);
    } else {
      setCnamFile(file);
    }
    setError('');
  };

  const uploadFile = async (file: File, type: 'oneci' | 'cnam'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${type}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const verifyONECI = async () => {
    if (!oneciNumber || !firstName || !lastName || !dateOfBirth) {
      setError('Veuillez remplir tous les champs pour la vérification ONECI');
      return;
    }

    setVerifyingONECI(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oneci-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          cniNumber: oneciNumber,
          firstName,
          lastName,
          dateOfBirth,
          userId: user?.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de vérification ONECI');
      }

      if (result.verified) {
        setSuccess('✅ CNI vérifiée avec succès par ONECI');
        await loadVerificationData();
      } else {
        setError('❌ La vérification ONECI a échoué. Vérifiez vos informations.');
      }
    } catch (err: any) {
      console.error('ONECI verification error:', err);
      setError(err.message || 'Erreur lors de la vérification ONECI');
    } finally {
      setVerifyingONECI(false);
    }
  };

  const verifyCNAM = async () => {
    if (!cnamNumber || !firstName || !lastName) {
      setError('Veuillez remplir tous les champs pour la vérification CNAM');
      return;
    }

    setVerifyingCNAM(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cnam-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          cnamNumber,
          firstName,
          lastName,
          userId: user?.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de vérification CNAM');
      }

      if (result.verified) {
        setSuccess('✅ CNAM vérifié avec succès');
        await loadVerificationData();
      } else {
        setError('❌ La vérification CNAM a échoué. Vérifiez vos informations.');
      }
    } catch (err: any) {
      console.error('CNAM verification error:', err);
      setError(err.message || 'Erreur lors de la vérification CNAM');
    } finally {
      setVerifyingCNAM(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let oneciUrl = verification?.oneci_document_url || null;
      let cnamUrl = verification?.cnam_document_url || null;

      if (oneciFile) {
        oneciUrl = await uploadFile(oneciFile, 'oneci');
      }

      if (cnamFile) {
        cnamUrl = await uploadFile(cnamFile, 'cnam');
      }

      if (verification) {
        const { error: updateError } = await supabase
          .from('user_verifications')
          .update({
            oneci_number: oneciNumber || null,
            cnam_number: cnamNumber || null,
            oneci_document_url: oneciUrl,
            cnam_document_url: cnamUrl,
            oneci_status: oneciFile ? 'en_attente' : verification.oneci_status,
            cnam_status: cnamFile ? 'en_attente' : verification.cnam_status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', verification.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_verifications')
          .insert({
            user_id: user.id,
            oneci_number: oneciNumber || null,
            cnam_number: cnamNumber || null,
            oneci_document_url: oneciUrl,
            cnam_document_url: cnamUrl,
            oneci_status: oneciUrl ? 'en_attente' : 'en_attente',
            cnam_status: cnamUrl ? 'en_attente' : 'en_attente',
          });

        if (insertError) throw insertError;
      }

      await apiKeyService.sendEmail(
        user.email!,
        'verification-success',
        {
          name: profile?.full_name || 'Utilisateur',
          documentType: oneciUrl && cnamUrl ? 'CNI et CNAM' : oneciUrl ? 'CNI' : 'CNAM'
        }
      );

      setSuccess('Demande de vérification soumise avec succès');
      setTimeout(() => {
        loadVerificationData();
        setOneciFile(null);
        setCnamFile(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting verification:', err);
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verifie':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'rejete':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'en_attente':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      verifie: 'bg-green-100 text-green-800 border-green-300',
      rejete: 'bg-red-100 text-red-800 border-red-300',
    };

    const labels = {
      en_attente: 'En attente',
      verifie: 'Vérifié',
      rejete: 'Rejeté',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600">
              Veuillez vous connecter pour demander une vérification
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-10 h-10 text-terracotta-600" />
              <h1 className="text-4xl font-bold text-gradient">Vérification d'identité</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Faites vérifier votre identité pour accéder à toutes les fonctionnalités de la plateforme
            </p>
          </div>

          {profile?.is_verified && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-6 mb-8">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Compte vérifié ANSUT
                  </h3>
                  <p className="text-green-800">
                    Votre compte est vérifié. Vous avez accès à toutes les fonctionnalités de Mon Toit.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-cyan-900 mb-3 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Pourquoi vérifier mon identité ?</span>
            </h3>
            <ul className="space-y-2 text-cyan-800">
              <li className="flex items-start space-x-2">
                <span className="text-cyan-600 font-bold">•</span>
                <span>Accédez à toutes les fonctionnalités de la plateforme</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-600 font-bold">•</span>
                <span>Augmentez votre crédibilité auprès des propriétaires</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-600 font-bold">•</span>
                <span>Sécurisez vos transactions immobilières</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-600 font-bold">•</span>
                <span>Conformité avec les exigences ANSUT de Côte d'Ivoire</span>
              </li>
            </ul>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700">{success}</p>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <FileText className="w-7 h-7 text-terracotta-600" />
                    <span>ONECI (Carte d'identité nationale)</span>
                  </h2>
                  {verification?.oneci_status && getStatusBadge(verification.oneci_status)}
                </div>

                {verification?.oneci_status === 'rejete' && verification.rejection_reason && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">
                      <span className="font-bold">Raison du rejet:</span> {verification.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Numéro ONECI
                    </label>
                    <input
                      type="text"
                      value={oneciNumber}
                      onChange={(e) => setOneciNumber(e.target.value)}
                      placeholder="Ex: CI1234567890"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                      required={!verification?.oneci_document_url}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Document ONECI (Recto-Verso)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-terracotta-400 transition-colors">
                      <input
                        type="file"
                        id="oneci-file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, 'oneci')}
                        className="hidden"
                      />
                      <label htmlFor="oneci-file" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-1">
                          {oneciFile ? oneciFile.name : 'Cliquez pour télécharger'}
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG ou PDF (max. 5MB)
                        </p>
                      </label>
                    </div>
                    {verification?.oneci_document_url && !oneciFile && (
                      <p className="text-sm text-green-600 mt-2 flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Document déjà téléchargé</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <FileText className="w-7 h-7 text-terracotta-600" />
                    <span>CNAM (Assurance maladie)</span>
                  </h2>
                  {verification?.cnam_status && getStatusBadge(verification.cnam_status)}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Numéro CNAM
                    </label>
                    <input
                      type="text"
                      value={cnamNumber}
                      onChange={(e) => setCnamNumber(e.target.value)}
                      placeholder="Ex: CNAM1234567890"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                      required={!verification?.cnam_document_url}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Carte CNAM
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-terracotta-400 transition-colors">
                      <input
                        type="file"
                        id="cnam-file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, 'cnam')}
                        className="hidden"
                      />
                      <label htmlFor="cnam-file" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-1">
                          {cnamFile ? cnamFile.name : 'Cliquez pour télécharger'}
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG ou PDF (max. 5MB)
                        </p>
                      </label>
                    </div>
                    {verification?.cnam_document_url && !cnamFile && (
                      <p className="text-sm text-green-600 mt-2 flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Document déjà téléchargé</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <button
                  type="submit"
                  disabled={submitting || (!oneciFile && !cnamFile && !oneciNumber && !cnamNumber)}
                  className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Soumettre pour vérification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
