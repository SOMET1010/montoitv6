import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Save, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ScoreSection from '../components/ScoreSection';
import AnsutBadge from '../components/AnsutBadge';
import AchievementBadges from '../components/AchievementBadges';
import VerificationBadge from '../components/VerificationBadge';
import RoleSwitcher from '../components/RoleSwitcher';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    address: '',
  });

  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }

    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        address: profile.address || '',
      });
      loadVerificationData();
    }
  }, [user, profile]);

  const loadVerificationData = async () => {
    try {
      const { data } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setVerificationData(data);
      }
    } catch (error) {
      console.error('Error loading verification data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess('Photo de profil mise à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          city: formData.city,
          address: formData.address,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationScore = () => {
    let score = 0;
    if (profile?.is_verified) score += 33;
    if (profile?.oneci_verified) score += 33;
    if (profile?.cnam_verified) score += 34;
    return score;
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-terracotta-500"></div>
      </div>
    );
  }

  const verificationScore = getVerificationScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 custom-cursor">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 animate-slide-down">
          <h1 className="text-4xl font-bold text-gradient mb-2 flex items-center space-x-3">
            <User className="h-10 w-10 text-terracotta-500" />
            <span>Mon Profil</span>
          </h1>
          <p className="text-gray-700 text-lg">Gérez vos informations personnelles et vos vérifications</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 animate-slide-down flex items-center space-x-3">
            <CheckCircle className="h-6 w-6" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 animate-shake flex items-center space-x-3">
            <AlertCircle className="h-6 w-6" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="card-scrapbook p-6 text-center animate-scale-in">
              <div className="relative inline-block mb-6">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Utilisateur'}
                    className="w-32 h-32 rounded-full border-4 border-terracotta-200 shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-terracotta-500 to-coral-500 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-white font-bold text-5xl">
                      {profile.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-terracotta-500 text-white p-3 rounded-full cursor-pointer hover:bg-terracotta-600 transition-all duration-300 transform hover:scale-110 shadow-lg"
                >
                  <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <h2 className="text-2xl font-bold text-gradient mb-2">
                {profile.full_name || 'Nom non renseigné'}
              </h2>
              <p className="text-gray-600 mb-3">{user?.email}</p>

              {verificationData?.ansut_certified && (
                <div className="mb-3">
                  <AnsutBadge certified={true} size="large" />
                </div>
              )}

              <div className="mb-4">
                <RoleSwitcher />
              </div>

              {verificationData && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {verificationData.oneci_status && (
                    <VerificationBadge type="oneci" status={verificationData.oneci_status} size="small" />
                  )}
                  {verificationData.cnam_status && verificationData.cnam_status !== 'en_attente' && (
                    <VerificationBadge type="cnam" status={verificationData.cnam_status} size="small" />
                  )}
                  {verificationData.face_verification_status && (
                    <VerificationBadge type="face" status={verificationData.face_verification_status} size="small" />
                  )}
                </div>
              )}
            </div>

            <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="font-bold text-gradient text-xl mb-4 flex items-center space-x-2">
                <Shield className="h-6 w-6 text-terracotta-500" />
                <span>Score de vérification</span>
              </h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">Progression</span>
                  <span className="text-2xl font-bold text-gradient">{verificationScore}%</span>
                </div>
                <div className="bg-white rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-terracotta-500 to-coral-500 h-full transition-all duration-500 shadow-glow"
                    style={{ width: `${verificationScore}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {verificationScore === 100
                  ? 'Votre profil est entièrement vérifié!'
                  : 'Complétez vos vérifications pour augmenter votre crédibilité.'}
              </p>
            </div>

            <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-bold text-gradient text-xl mb-4">Liens rapides</h3>
              <div className="space-y-2">
                {profile?.user_type === 'locataire' && (
                  <a href="/score-locataire" className="block text-terracotta-600 hover:text-terracotta-700 font-medium py-2 px-3 rounded-lg hover:bg-terracotta-50 transition">
                    Voir mon score locataire →
                  </a>
                )}
                <a href="/verification/parametres" className="block text-terracotta-600 hover:text-terracotta-700 font-medium py-2 px-3 rounded-lg hover:bg-terracotta-50 transition">
                  Paramètres de vérification →
                </a>
                <a href="/notifications/preferences" className="block text-terracotta-600 hover:text-terracotta-700 font-medium py-2 px-3 rounded-lg hover:bg-terracotta-50 transition">
                  Préférences de notifications →
                </a>
                <a href="/mes-contrats" className="block text-terracotta-600 hover:text-terracotta-700 font-medium py-2 px-3 rounded-lg hover:bg-terracotta-50 transition">
                  Mes contrats →
                </a>
                {(profile?.user_type === 'locataire' || profile?.user_type === 'proprietaire') && (
                  <a href={profile?.user_type === 'locataire' ? '/maintenance/locataire' : '/maintenance/proprietaire'} className="block text-terracotta-600 hover:text-terracotta-700 font-medium py-2 px-3 rounded-lg hover:bg-terracotta-50 transition">
                    Demandes de maintenance →
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card-scrapbook p-8 animate-slide-up">
              <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center space-x-2">
                <User className="h-7 w-7 text-terracotta-500" />
                <span>Informations personnelles</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl border border-cyan-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                          placeholder="Jean Dupont"
                          className="w-full pl-10 pr-4 py-3 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        Téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+225 XX XX XX XX XX"
                          className="w-full pl-10 pr-4 py-3 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        Ville
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Abidjan"
                          className="w-full pl-10 pr-4 py-3 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Adresse complète
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Cocody, Rue des Jardins"
                      className="w-full px-4 py-3 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                </button>
              </form>
            </div>

            <div className="card-scrapbook p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center space-x-2">
                <Shield className="h-7 w-7 text-terracotta-500" />
                <span>Vérifications ANSUT</span>
              </h2>

              <div className="space-y-4">
                <div className={`p-6 rounded-2xl border-2 ${
                  profile.is_verified
                    ? 'bg-gradient-to-br from-olive-50 to-green-50 border-olive-300'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        Vérification ANSUT
                      </h3>
                      <p className="text-gray-700 text-sm mb-4">
                        Vérification de base de votre identité par l'ANSUT. Augmente votre crédibilité auprès des propriétaires.
                      </p>
                    </div>
                    {profile.is_verified ? (
                      <div className="ml-4">
                        <CheckCircle className="h-8 w-8 text-olive-600" />
                      </div>
                    ) : (
                      <div className="ml-4">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {!profile.is_verified && (
                    <button
                      onClick={() => alert('La vérification ANSUT sera disponible prochainement')}
                      className="btn-primary px-6 py-2"
                    >
                      Vérifier maintenant
                    </button>
                  )}
                </div>

                <div className={`p-6 rounded-2xl border-2 ${
                  profile.oneci_verified
                    ? 'bg-gradient-to-br from-olive-50 to-green-50 border-olive-300'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        Vérification ONECI
                      </h3>
                      <p className="text-gray-700 text-sm mb-4">
                        Vérification de votre pièce d'identité nationale auprès de l'ONECI. Indispensable pour les locations.
                      </p>
                    </div>
                    {profile.oneci_verified ? (
                      <div className="ml-4">
                        <CheckCircle className="h-8 w-8 text-olive-600" />
                      </div>
                    ) : (
                      <div className="ml-4">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {!profile.oneci_verified && (
                    <button
                      onClick={() => alert('La vérification ONECI sera disponible prochainement')}
                      className="btn-primary px-6 py-2"
                    >
                      Vérifier maintenant
                    </button>
                  )}
                </div>

                <div className={`p-6 rounded-2xl border-2 ${
                  profile.cnam_verified
                    ? 'bg-gradient-to-br from-olive-50 to-green-50 border-olive-300'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        Vérification CNAM
                      </h3>
                      <p className="text-gray-700 text-sm mb-4">
                        Vérification de votre affiliation à la CNAM. Prouve votre solvabilité et sérieux professionnel.
                      </p>
                    </div>
                    {profile.cnam_verified ? (
                      <div className="ml-4">
                        <CheckCircle className="h-8 w-8 text-olive-600" />
                      </div>
                    ) : (
                      <div className="ml-4">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {!profile.cnam_verified && (
                    <button
                      onClick={() => alert('La vérification CNAM sera disponible prochainement')}
                      className="btn-primary px-6 py-2"
                    >
                      Vérifier maintenant
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 glass-card rounded-2xl p-6 bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-300">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center space-x-2">
                  <span>💡</span>
                  <span>Pourquoi se vérifier?</span>
                </h4>
                <ul className="text-sm text-amber-800 space-y-2">
                  <li>• Augmentez vos chances d'être accepté par les propriétaires</li>
                  <li>• Améliorez votre score de candidature</li>
                  <li>• Accédez à des propriétés premium</li>
                  <li>• Établissez la confiance avec la communauté Mon Toit</li>
                </ul>
              </div>
            </div>

            {profile?.user_type === 'locataire' && user && (
              <ScoreSection userId={user.id} />
            )}

            {verificationData && (
              <AchievementBadges
                oneciVerified={verificationData.oneci_status === 'verifie'}
                cnamVerified={verificationData.cnam_status === 'verifie'}
                faceVerified={verificationData.face_verification_status === 'verifie'}
                tenantScore={verificationData.tenant_score || 0}
                paymentCount={0}
                className="animate-slide-up"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
