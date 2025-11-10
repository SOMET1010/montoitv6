import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Upload, X } from 'lucide-react';
import { disputeService } from '../../services/trustValidationService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateDispute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const leaseId = searchParams.get('leaseId');

  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState({
    disputeType: 'deposit_return',
    description: '',
    amountDisputed: '',
    urgency: 'normal',
    evidenceFiles: [] as string[]
  });

  useEffect(() => {
    if (leaseId) {
      loadLease();
    }
  }, [leaseId]);

  const loadLease = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          properties (*),
          tenant:profiles!leases_tenant_id_fkey (*),
          landlord:profiles!leases_landlord_id_fkey (*)
        `)
        .eq('id', leaseId)
        .single();

      if (error) throw error;
      setLease(data);
    } catch (err) {
      console.error('Erreur chargement bail:', err);
      alert('Bail introuvable');
      navigate('/my-contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFiles(true);
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile!.id}-${Date.now()}.${fileExt}`;
        const filePath = `disputes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        evidenceFiles: [...prev.evidenceFiles, ...uploadedUrls]
      }));
    } catch (err) {
      console.error('Erreur upload fichiers:', err);
      alert('Erreur lors du téléchargement des fichiers');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      alert('Veuillez décrire le litige');
      return;
    }

    try {
      setSubmitting(true);

      const dispute = await disputeService.createDispute({
        leaseId: leaseId!,
        openedBy: profile!.id,
        againstUser: profile!.id === lease.tenant_id ? lease.landlord_id : lease.tenant_id,
        disputeType: formData.disputeType as any,
        description: formData.description,
        amountDisputed: formData.amountDisputed ? parseFloat(formData.amountDisputed) : undefined,
        urgency: formData.urgency as any,
        evidenceFiles: formData.evidenceFiles
      });

      navigate(`/dispute/${dispute.id}`);
    } catch (err: any) {
      console.error('Erreur création litige:', err);
      alert(err.message || 'Erreur lors de la création du litige');
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

  if (!lease) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bail introuvable</h2>
          <button
            onClick={() => navigate('/my-contracts')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Retour à mes contrats
          </button>
        </div>
      </div>
    );
  }

  const otherParty = profile?.id === lease.tenant_id ? lease.landlord : lease.tenant;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Signaler un problème</h1>
                <p className="text-orange-100">Ouvrir un litige avec médiation</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Lease Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Informations du bail</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p><span className="font-medium">Propriété:</span> {lease.properties.title}</p>
                <p><span className="font-medium">Adresse:</span> {lease.properties.address}</p>
                <p>
                  <span className="font-medium">Contre:</span> {otherParty.first_name} {otherParty.last_name}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Comment fonctionne la médiation ?</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">1.</span>
                  <span>Vous décrivez le problème et joignez des preuves</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">2.</span>
                  <span>Un médiateur certifié est assigné automatiquement (sous 24h)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">3.</span>
                  <span>Le médiateur examine les preuves des 2 parties</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">4.</span>
                  <span>Le médiateur propose une solution équitable</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">5.</span>
                  <span>Si les 2 parties acceptent → résolution ✅ (75% de succès !)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">6.</span>
                  <span>Si refus → escalade vers arbitrage externe</span>
                </li>
              </ol>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dispute Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de litige *
                </label>
                <select
                  value={formData.disputeType}
                  onChange={(e) => setFormData({ ...formData, disputeType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="deposit_return">Restitution dépôt de garantie</option>
                  <option value="inventory_disagreement">Désaccord état des lieux</option>
                  <option value="unpaid_rent">Impayés de loyer</option>
                  <option value="maintenance_not_done">Maintenance non effectuée</option>
                  <option value="nuisance">Nuisances</option>
                  <option value="early_termination">Résiliation anticipée</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description détaillée du problème *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez le problème en détail. Plus vous êtes précis, plus le médiateur pourra vous aider efficacement."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 50 caractères. Actuel: {formData.description.length}
                </p>
              </div>

              {/* Amount Disputed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant disputé (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.amountDisputed}
                  onChange={(e) => setFormData({ ...formData, amountDisputed: e.target.value })}
                  placeholder="Ex: 400000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optionnel. Indiquez le montant si le litige concerne une somme d'argent.
                </p>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgence
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="normal"
                      checked={formData.urgency === 'normal'}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Normale (résolution sous 7 jours)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="urgent"
                      checked={formData.urgency === 'urgent'}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-red-700 font-medium">Urgente (résolution sous 48h)</span>
                  </label>
                </div>
              </div>

              {/* Evidence Files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preuves (photos, documents)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-4">
                    Joignez des photos de l'état des lieux, messages, devis, etc.
                  </p>
                  <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    {uploadingFiles ? 'Téléchargement...' : 'Choisir des fichiers'}
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingFiles}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Max 10 fichiers, 5 MB chacun
                  </p>
                </div>

                {formData.evidenceFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Fichiers joints ({formData.evidenceFiles.length})
                    </p>
                    {formData.evidenceFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                      >
                        <span className="text-sm text-gray-700 truncate flex-1">
                          Fichier {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-2 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Avant de soumettre :</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Assurez-vous d'avoir essayé de résoudre le problème directement avec l'autre partie</li>
                      <li>Joignez toutes les preuves disponibles (photos, messages, documents)</li>
                      <li>Soyez factuel et précis dans votre description</li>
                      <li>Les litiges abusifs peuvent entraîner des sanctions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFiles || formData.description.length < 50}
                  className="flex-1 py-3 px-6 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Création en cours...
                    </span>
                  ) : (
                    'Ouvrir le litige'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
