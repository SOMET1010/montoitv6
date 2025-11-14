import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, Upload, CheckCircle, AlertCircle, FileText, Camera, Loader, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VerificationBadge from '../components/VerificationBadge';
import AnsutBadge from '../components/AnsutBadge';
import SmilelessVerification from '../components/SmilelessVerification';

interface VerificationData {
  id: string;
  user_id: string;
  oneci_status: 'en_attente' | 'verifie' | 'rejete';
  cnam_status: 'en_attente' | 'verifie' | 'rejete';
  face_verification_status: 'en_attente' | 'verifie' | 'rejete';
  oneci_document_url: string | null;
  cnam_document_url: string | null;
  selfie_image_url: string | null;
  oneci_number: string | null;
  cnam_number: string | null;
  rejection_reason: string | null;
  ansut_certified: boolean;
  created_at: string;
  updated_at: string;
}

export default function AnsutVerification() {
  const { user, profile } = useAuth();
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [oneciNumber, setOneciNumber] = useState('');
  const [cnamNumber, setCnamNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [oneciFile, setOneciFile] = useState<File | null>(null);
  const [oneciPreview, setOneciPreview] = useState<string | null>(null);
  const [cnamFile, setCnamFile] = useState<File | null>(null);
  const [cnamPreview, setCnamPreview] = useState<string | null>(null);

  const [verifyingONECI, setVerifyingONECI] = useState(false);
  const [verifyingCNAM, setVerifyingCNAM] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);

  const [showWebcam, setShowWebcam] = useState(false);
  const [selfieCapture, setSelfieCapture] = useState<string | null>(null);
  const [useSmileless, setUseSmileless] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (user) {
      loadVerificationData();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'oneci') {
        setOneciFile(file);
        if (file.type.startsWith('image/')) {
          setOneciPreview(reader.result as string);
        }
      } else {
        setCnamFile(file);
        if (file.type.startsWith('image/')) {
          setCnamPreview(reader.result as string);
        }
      }
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const uploadFile = async (file: File, type: 'oneci' | 'cnam' | 'selfie'): Promise<string> => {
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
    if (!oneciNumber || !firstName || !lastName || !dateOfBirth || !oneciFile) {
      setError('Veuillez remplir tous les champs et télécharger votre CNI pour la vérification ONECI');
      return;
    }

    setVerifyingONECI(true);
    setError('');
    setSuccess('');

    try {
      const documentUrl = await uploadFile(oneciFile, 'oneci');

      if (!verification) {
        const { error: insertError } = await supabase
          .from('user_verifications')
          .insert({
            user_id: user?.id,
            oneci_number: oneciNumber,
            oneci_document_url: documentUrl,
            oneci_status: 'en_attente',
          });

        if (insertError) throw insertError;
        await loadVerificationData();
      } else {
        const { error: updateError } = await supabase
          .from('user_verifications')
          .update({
            oneci_number: oneciNumber,
            oneci_document_url: documentUrl,
            oneci_status: 'en_attente',
          })
          .eq('id', verification.id);

        if (updateError) throw updateError;
      }

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
    if (!cnamNumber || !firstName || !lastName || !cnamFile) {
      setError('Veuillez remplir tous les champs et télécharger votre carte CNAM pour la vérification');
      return;
    }

    setVerifyingCNAM(true);
    setError('');
    setSuccess('');

    try {
      const documentUrl = await uploadFile(cnamFile, 'cnam');

      const { error: updateError } = await supabase
        .from('user_verifications')
        .update({
          cnam_number: cnamNumber,
          cnam_document_url: documentUrl,
          cnam_status: 'en_attente',
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

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

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowWebcam(true);
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setSelfieCapture(imageData);
        stopWebcam();
      }
    }
  };

  const verifyFace = async () => {
    if (!selfieCapture || !oneciNumber) {
      setError('Veuillez capturer un selfie et avoir une CNI vérifiée');
      return;
    }

    setVerifyingFace(true);
    setError('');
    setSuccess('');

    try {
      const blob = await (await fetch(selfieCapture)).blob();
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      const selfieUrl = await uploadFile(file, 'selfie');

      const { error: updateError } = await supabase
        .from('user_verifications')
        .update({
          selfie_image_url: selfieUrl,
          face_verification_status: 'en_attente',
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smile-id-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          userId: user?.id,
          idNumber: oneciNumber,
          idType: 'NATIONAL_ID',
          country: 'CI',
          selfieImage: selfieCapture.split(',')[1]
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de vérification faciale');
      }

      if (result.verified) {
        setSuccess(`✅ Vérification faciale réussie! Score de confiance: ${result.confidenceScore}%`);
        await loadVerificationData();
      } else {
        setError(`❌ La vérification faciale a échoué. Score: ${result.confidenceScore}%`);
      }
    } catch (err: any) {
      console.error('Face verification error:', err);
      setError(err.message || 'Erreur lors de la vérification faciale');
    } finally {
      setVerifyingFace(false);
    }
  };

  const handleSmilelessVerified = async (result: any) => {
    setSuccess(`✅ Vérification faciale réussie avec Smileless! Score: ${(result.matching_score * 100).toFixed(0)}%`);

    await supabase
      .from('user_verifications')
      .update({
        face_verification_status: 'verifie',
      })
      .eq('user_id', user?.id);

    await loadVerificationData();
  };

  const handleSmilelessFailed = (errorMsg: string) => {
    setError(`❌ Vérification Smileless échouée: ${errorMsg}`);
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
              Veuillez vous connecter pour accéder à la vérification Mon Toit
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-10 h-10 text-terracotta-600" />
                <h1 className="text-4xl font-bold text-gradient">Vérification Mon Toit</h1>
              </div>
              {verification?.ansut_certified && (
                <AnsutBadge certified={true} size="large" />
              )}
            </div>
            <p className="text-gray-600 text-lg">
              Obtenez votre certification officielle ANSUT en trois étapes simples
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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto"></div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* ONECI Verification */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                      <FileText className="w-7 h-7 text-terracotta-600" />
                      <span>Étape 1: ONECI</span>
                    </h2>
                    {verification?.oneci_status && (
                      <VerificationBadge type="oneci" status={verification.oneci_status} />
                    )}
                  </div>

                  {verification?.oneci_status !== 'verifie' && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Prénom
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Votre prénom"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Nom
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Votre nom"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Numéro CNI (12 chiffres)
                          </label>
                          <input
                            type="text"
                            value={oneciNumber}
                            onChange={(e) => setOneciNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                            placeholder="Ex: 123456789012"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                            maxLength={12}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Date de naissance
                          </label>
                          <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Photo CNI (Recto-Verso)
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
                            {oneciPreview ? (
                              <div className="relative">
                                <img src={oneciPreview} alt="CNI preview" className="max-h-48 mx-auto rounded-lg" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setOneciFile(null);
                                    setOneciPreview(null);
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-700 font-medium mb-1">
                                  Cliquez pour télécharger
                                </p>
                                <p className="text-sm text-gray-500">
                                  PNG, JPG ou PDF (max. 5MB)
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={verifyONECI}
                        disabled={verifyingONECI || !oneciNumber || !firstName || !lastName || !dateOfBirth || !oneciFile}
                        className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {verifyingONECI ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Vérification en cours...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            <span>Vérifier mon identité</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {verification?.oneci_status === 'verifie' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-bold text-green-900">Identité vérifiée</p>
                        <p className="text-sm text-green-700">Votre CNI a été validée par ONECI</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CNAM Verification */}
                {verification?.oneci_status === 'verifie' && (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                        <FileText className="w-7 h-7 text-terracotta-600" />
                        <span>Étape 2: CNAM (Optionnel)</span>
                      </h2>
                      {verification?.cnam_status && (
                        <VerificationBadge type="cnam" status={verification.cnam_status} />
                      )}
                    </div>

                    {verification?.cnam_status !== 'verifie' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                          <p className="text-sm text-blue-800">
                            La vérification CNAM est optionnelle mais recommandée pour améliorer votre score de confiance.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Numéro CNAM (10 chiffres)
                          </label>
                          <input
                            type="text"
                            value={cnamNumber}
                            onChange={(e) => setCnamNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="Ex: 1234567890"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                            maxLength={10}
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
                              {cnamPreview ? (
                                <div className="relative">
                                  <img src={cnamPreview} alt="CNAM preview" className="max-h-48 mx-auto rounded-lg" />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCnamFile(null);
                                      setCnamPreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-700 font-medium mb-1">
                                    Cliquez pour télécharger
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    PNG, JPG ou PDF (max. 5MB)
                                  </p>
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={verifyCNAM}
                          disabled={verifyingCNAM || !cnamNumber || !cnamFile}
                          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {verifyingCNAM ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              <span>Vérification en cours...</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5" />
                              <span>Vérifier CNAM</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {verification?.cnam_status === 'verifie' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-bold text-green-900">CNAM vérifié</p>
                          <p className="text-sm text-green-700">Votre affiliation CNAM est active</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Face Verification */}
                {verification?.oneci_status === 'verifie' && (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                        <Camera className="w-7 h-7 text-terracotta-600" />
                        <span>Étape 3: Reconnaissance faciale</span>
                      </h2>
                      {verification?.face_verification_status && (
                        <VerificationBadge type="face" status={verification.face_verification_status} />
                      )}
                    </div>

                    {verification?.face_verification_status !== 'verifie' && (
                      <div className="space-y-6">
                        {useSmileless && oneciPreview && (
                          <SmilelessVerification
                            userId={user?.id || ''}
                            cniPhotoUrl={oneciPreview}
                            onVerified={handleSmilelessVerified}
                            onFailed={handleSmilelessFailed}
                          />
                        )}

                        {!useSmileless && (
                          <div className="space-y-4">
                            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                              <p className="text-sm text-cyan-800">
                                Nous allons comparer votre selfie avec la photo de votre CNI pour confirmer votre identité.
                              </p>
                            </div>

                            {!selfieCapture && !showWebcam && (
                              <button
                                onClick={startWebcam}
                                className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
                              >
                                <Camera className="w-5 h-5" />
                                <span>Activer la caméra</span>
                              </button>
                            )}

                            {showWebcam && (
                              <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden bg-black">
                                  <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-80 border-4 border-white rounded-full opacity-50"></div>
                                  </div>
                                </div>
                                <div className="flex space-x-3">
                                  <button
                                    onClick={captureSelfie}
                                    className="flex-1 btn-primary py-3 flex items-center justify-center space-x-2"
                                  >
                                    <Camera className="w-5 h-5" />
                                    <span>Capturer</span>
                                  </button>
                                  <button
                                    onClick={stopWebcam}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}

                            {selfieCapture && (
                              <div className="space-y-4">
                                <div className="relative">
                                  <img src={selfieCapture} alt="Selfie" className="w-full rounded-xl" />
                                  <button
                                    onClick={() => setSelfieCapture(null)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                                <button
                                  onClick={verifyFace}
                                  disabled={verifyingFace}
                                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                  {verifyingFace ? (
                                    <>
                                      <Loader className="w-5 h-5 animate-spin" />
                                      <span>Vérification en cours...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="w-5 h-5" />
                                      <span>Vérifier mon visage</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            <canvas ref={canvasRef} className="hidden" />
                          </div>
                        )}

                        <div className="text-center pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setUseSmileless(!useSmileless)}
                            className="text-sm text-gray-600 hover:text-orange-600 underline"
                          >
                            {useSmileless ? 'Utiliser la méthode traditionnelle' : 'Utiliser Smileless (Gratuit)'}
                          </button>
                        </div>
                      </div>
                    )}

                    {verification?.face_verification_status === 'verifie' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-bold text-green-900">Visage vérifié</p>
                          <p className="text-sm text-green-700">Votre identité a été confirmée par reconnaissance faciale</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
