import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, CheckCircle, XCircle, Loader, ExternalLink, RefreshCw } from 'lucide-react';

interface SmilelessVerificationProps {
  userId: string;
  cniPhotoUrl: string;
  onVerified: (result: VerificationResult) => void;
  onFailed: (error: string) => void;
}

interface VerificationResult {
  verified: boolean;
  provider: string;
  matching_score?: number;
  verification_id?: string;
}

type VerificationStatus = 'idle' | 'uploading' | 'waiting' | 'verified' | 'failed';

export default function SmilelessVerification({
  userId,
  cniPhotoUrl,
  onVerified,
  onFailed,
}: SmilelessVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [matchingScore, setMatchingScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const MAX_POLLING_ATTEMPTS = 100;
  const POLLING_INTERVAL = 3000;
  const POLLING_TIMEOUT = 5 * 60 * 1000;

  useEffect(() => {
    let pollInterval: number | null = null;
    let timeoutId: number | null = null;

    if (status === 'waiting' && documentId) {
      pollInterval = window.setInterval(() => {
        checkVerificationStatus();
      }, POLLING_INTERVAL);

      timeoutId = window.setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval);
        setStatus('failed');
        setErrorMessage('Timeout: Vous n\'avez pas complété la vérification dans les 5 minutes');
        onFailed('Timeout: Vérification non complétée');
      }, POLLING_TIMEOUT);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, documentId]);

  const uploadDocument = async () => {
    setStatus('uploading');
    setErrorMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('smileless-face-verify', {
        body: {
          action: 'upload_document',
          cni_photo_url: cniPhotoUrl,
          user_id: userId,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Échec du téléchargement du document');
      }

      setDocumentId(data.document_id);
      setSelfieUrl(data.selfie_url);
      setVerificationId(data.verification_id);
      setStatus('waiting');
      setPollingAttempts(0);

      window.open(data.selfie_url, '_blank', 'width=800,height=600,noopener,noreferrer');
    } catch (error: any) {
      console.error('[SmilelessVerification] Upload failed:', error);
      setStatus('failed');
      setErrorMessage(error.message || 'Erreur lors du téléchargement');
      onFailed(error.message);
    }
  };

  const checkVerificationStatus = async () => {
    if (!documentId || pollingAttempts >= MAX_POLLING_ATTEMPTS) {
      setStatus('failed');
      setErrorMessage('Nombre maximum de tentatives atteint');
      onFailed('Maximum polling attempts reached');
      return;
    }

    setPollingAttempts(prev => prev + 1);

    try {
      const { data, error } = await supabase.functions.invoke('smileless-face-verify', {
        body: {
          action: 'check_status',
          document_id: documentId,
          verification_id: verificationId,
        },
      });

      if (error && error.message) {
        console.error('[SmilelessVerification] Status check error:', error);
        return;
      }

      if (data.status === 'verified') {
        setStatus('verified');
        setMatchingScore(data.matching_score || null);
        onVerified({
          verified: true,
          provider: 'smileless',
          matching_score: data.matching_score,
          verification_id: verificationId || undefined,
        });
      } else if (data.status === 'failed') {
        setStatus('failed');
        setMatchingScore(data.matching_score || null);
        setErrorMessage(data.message || 'Le visage ne correspond pas au document');
        onFailed(data.message || 'Vérification échouée');
      }
    } catch (error: any) {
      console.error('[SmilelessVerification] Polling error:', error);
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setDocumentId(null);
    setVerificationId(null);
    setSelfieUrl(null);
    setMatchingScore(null);
    setErrorMessage('');
    setPollingAttempts(0);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <Camera className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vérification d'Identité</h2>
          <p className="text-sm text-gray-600">Service gratuit powered by Smileless (NeoFace)</p>
        </div>
      </div>

      {status === 'idle' && (
        <div>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Comment ça marche ?</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Nous téléchargeons votre photo de CNI de manière sécurisée</li>
              <li>Une fenêtre s'ouvre pour capturer votre selfie</li>
              <li>Clignez des yeux 2 fois pour prouver que vous êtes réel</li>
              <li>Le système compare automatiquement les deux photos</li>
              <li>Votre identité est vérifiée instantanément</li>
            </ol>
          </div>

          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Avantages :</p>
                <ul className="space-y-1">
                  <li>• Gratuit et rapide</li>
                  <li>• Détection de vivacité (anti-spoofing)</li>
                  <li>• Sécurisé et confidentiel</li>
                  <li>• Résultat instantané</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={uploadDocument}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Commencer la Vérification
          </button>
        </div>
      )}

      {status === 'uploading' && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Loader className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Téléchargement de votre document...
          </p>
          <p className="text-sm text-gray-600">
            Veuillez patienter quelques instants
          </p>
        </div>
      )}

      {status === 'waiting' && (
        <div className="text-center py-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-orange-500 rounded-full p-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>

          <p className="text-xl font-bold text-gray-900 mb-2">
            En attente de votre selfie...
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Une fenêtre s'est ouverte pour capturer votre selfie.<br />
            Suivez les instructions à l'écran et clignez des yeux 2 fois.
          </p>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-3">
              <div className="animate-pulse">●</div>
              <span>Tentative {pollingAttempts} / {MAX_POLLING_ATTEMPTS}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(pollingAttempts / MAX_POLLING_ATTEMPTS) * 100}%` }}
              ></div>
            </div>
          </div>

          {selfieUrl && (
            <a
              href={selfieUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Rouvrir la fenêtre de capture
            </a>
          )}
        </div>
      )}

      {status === 'verified' && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 mb-2">
            Identité Vérifiée !
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Votre identité a été confirmée avec succès
          </p>
          {matchingScore !== null && (
            <div className="inline-block px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-600">Score de correspondance</p>
              <p className="text-2xl font-bold text-green-600">
                {(matchingScore * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      )}

      {status === 'failed' && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600 mb-2">
            Vérification Échouée
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {errorMessage || 'Une erreur s\'est produite lors de la vérification'}
          </p>
          {matchingScore !== null && matchingScore < 0.7 && (
            <div className="mb-6 inline-block px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-gray-600">Score de correspondance</p>
              <p className="text-2xl font-bold text-red-600">
                {(matchingScore * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Minimum requis: 70%</p>
            </div>
          )}
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
