import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ContractAnnexesProps {
  contractId: string;
  onUploadComplete?: () => void;
}

interface Annex {
  id: string;
  type: 'etat_lieux' | 'assurance' | 'reglement_copropriete' | 'notice_info';
  name: string;
  uploaded: boolean;
  required: boolean;
  file?: File;
  url?: string;
}

export default function ContractAnnexes({ contractId, onUploadComplete }: ContractAnnexesProps) {
  const [annexes, setAnnexes] = useState<Annex[]>([
    {
      id: 'etat_lieux',
      type: 'etat_lieux',
      name: 'État des lieux d\'entrée',
      uploaded: false,
      required: true
    },
    {
      id: 'assurance',
      type: 'assurance',
      name: 'Attestation d\'assurance risques locatifs',
      uploaded: false,
      required: true
    },
    {
      id: 'reglement',
      type: 'reglement_copropriete',
      name: 'Règlement de copropriété',
      uploaded: false,
      required: false
    },
    {
      id: 'notice',
      type: 'notice_info',
      name: 'Notice d\'information',
      uploaded: false,
      required: true
    }
  ]);

  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleFileSelect = async (annexId: string, file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 5 MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Utilisez PDF, JPG ou PNG');
      return;
    }

    setUploading(annexId);
    setUploadProgress({ ...uploadProgress, [annexId]: 0 });

    try {
      const annex = annexes.find(a => a.id === annexId);
      if (!annex) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${contractId}/${annexId}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('contract_documents')
        .insert({
          contract_id: contractId,
          document_type: 'autre',
          document_name: annex.name,
          document_url: urlData.publicUrl,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (dbError) throw dbError;

      setAnnexes(annexes.map(a =>
        a.id === annexId
          ? { ...a, uploaded: true, url: urlData.publicUrl }
          : a
      ));

      setUploadProgress({ ...uploadProgress, [annexId]: 100 });

      if (onUploadComplete) {
        onUploadComplete();
      }

      alert('✅ Document téléchargé avec succès');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors du téléchargement du fichier');
    } finally {
      setUploading(null);
    }
  };

  const allRequiredUploaded = annexes
    .filter(a => a.required)
    .every(a => a.uploaded);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Annexes obligatoires</h2>
          <p className="text-sm text-gray-600 mt-1">
            Documents requis pour la validité du contrat de bail
          </p>
        </div>
        {allRequiredUploaded && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold">Complet</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {annexes.map((annex) => (
          <div
            key={annex.id}
            className={`border rounded-lg p-4 transition ${
              annex.uploaded
                ? 'border-green-300 bg-green-50'
                : annex.required
                ? 'border-orange-300 bg-orange-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="mt-1">
                  {annex.uploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : annex.required ? (
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{annex.name}</h3>
                    {annex.required && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  {annex.uploaded && annex.url && (
                    <a
                      href={annex.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      Voir le document
                    </a>
                  )}
                  {uploading === annex.id && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[annex.id] || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Téléchargement en cours...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!annex.uploaded && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(annex.id, file);
                    }}
                    className="hidden"
                    disabled={uploading !== null}
                  />
                  <div className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {uploading === annex.id ? 'Envoi...' : 'Choisir'}
                    </span>
                  </div>
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-2">Formats acceptés:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>PDF (recommandé)</li>
              <li>Images: JPG, JPEG, PNG</li>
              <li>Taille maximale: 5 MB par fichier</li>
            </ul>
            <p className="mt-3 font-medium">
              Ces annexes sont nécessaires pour la conformité du contrat avec la législation ivoirienne.
            </p>
          </div>
        </div>
      </div>

      {!allRequiredUploaded && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-900">
              Le contrat ne pourra pas être signé tant que tous les documents obligatoires n'auront pas été téléchargés.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
