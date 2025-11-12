import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader, FileText, User, Camera, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ONECIVerificationFormProps {
  onVerified: () => void;
  onError: (error: string) => void;
}

interface VerificationData {
  cni_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
}

export default function ONECIVerificationForm({ onVerified, onError }: ONECIVerificationFormProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cniFile, setCniFile] = useState<File | null>(null);
  const [cniUrl, setCniUrl] = useState<string>('');
  const [formData, setFormData] = useState<VerificationData>({
    cni_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    place_of_birth: '',
    nationality: 'Ivoirienne'
  });

  // Séparer le nom complet si disponible
  React.useEffect(() => {
    if (profile?.full_name) {
      const parts = profile.full_name.split(' ');
      setFormData(prev => ({
        ...prev,
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ') || ''
      }));
    }
  }, [profile?.full_name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Vérifier le type de fichier
    if (!file.type.includes('image/')) {
      onError('Veuillez télécharger une image (JPG, PNG)');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError('La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/cni-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('identity-documents')
        .getPublicUrl(fileName);

      setCniUrl(publicUrl);
      setCniFile(file);
    } catch (error: any) {
      console.error('File upload error:', error);
      onError(error.message || 'Erreur lors du téléchargement du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cniUrl) return;

    setLoading(true);
    onError('');

    try {
      // Créer la demande de vérification ONECI
      const { data: verification, error: createError } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: user.id,
          cni_number: formData.cni_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          place_of_birth: formData.place_of_birth,
          nationality: formData.nationality,
          cni_photo_url: cniUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Appeler l'Edge Function pour la vérification ONECI
      const { data, error } = await supabase.functions.invoke('oneci-verification', {
        body: {
          verificationId: verification.id,
          cniNumber: formData.cni_number,
          firstName: formData.first_name,
          lastName: formData.last_name,
          dateOfBirth: formData.date_of_birth,
          userId: user.id
        }
      });

      if (error) throw error;

      // Mettre à jour le statut de l'utilisateur
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ oneci_verified: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onVerified();
    } catch (error: any) {
      console.error('ONECI verification error:', error);
      onError(error.message || 'Erreur lors de la vérification ONECI');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className={`p-6 rounded-2xl border-2 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Vérification ONECI</span>
            </h3>
            <p className="text-gray-700 text-sm mb-3">
              Vérifiez votre pièce d'identité nationale auprès de l'Office National d'Identification (ONECI)
            </p>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Pourquoi cette vérification ?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Indispensable pour les locations</li>
                <li>• Augmente votre crédibilité de 40%</li>
                <li>• Requis par la plupart des propriétaires</li>
                <li>• Vérification rapide en 24-48h</li>
              </ul>
            </div>
          </div>
          <div className="ml-4">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <FileText className="h-5 w-5" />
          <span>Vérifier ma CNI</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border-2 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-900 flex items-center space-x-2">
          <FileText className="h-6 w-6 text-blue-500" />
          <span>Vérification ONECI</span>
        </h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Camera className="h-4 w-4 text-blue-500" />
            <span>Photo de votre CNI</span>
          </h4>

          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
            {cniUrl ? (
              <div className="space-y-3">
                <img
                  src={cniUrl}
                  alt="CNI"
                  className="max-h-48 mx-auto rounded-lg shadow-md"
                />
                <p className="text-sm text-green-600 font-medium">
                  ✓ CNI téléchargée avec succès
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCniUrl('');
                    setCniFile(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Changer de photo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-blue-400 mx-auto" />
                <div>
                  <p className="text-gray-700 font-medium">
                    {uploading ? 'Téléchargement...' : 'Téléchargez votre CNI'}
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG jusqu'à 5MB
                  </p>
                </div>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium inline-flex items-center space-x-2">
                    {uploading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Téléchargement...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Choisir un fichier</span>
                      </>
                    )}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <User className="h-4 w-4 text-blue-500" />
            <span>Informations de la CNI</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro CNI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cni_number"
                value={formData.cni_number}
                onChange={handleInputChange}
                required
                placeholder="CI1234567890123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationalité <span className="text-red-500">*</span>
              </label>
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Ivoirienne">Ivoirienne</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                placeholder="Jean"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                placeholder="Dupont"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="place_of_birth"
                value={formData.place_of_birth}
                onChange={handleInputChange}
                required
                placeholder="Abidjan, Côte d'Ivoire"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important :</p>
              <p>
                Assurez-vous que les informations correspondent exactement à celles sur votre CNI.
                La vérification peut prendre 24-48 heures. Vous recevrez une notification
                dès que votre identité sera validée par l'ONECI.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !cniUrl || uploading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Vérification en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Vérifier ma CNI</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}