import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';

interface VoiceSearchProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  placeholder?: string;
}

export default function VoiceSearch({
  onResult,
  onError,
  language = 'fr-FR',
  placeholder = 'Cliquez sur le micro et parlez...',
}: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startListening = async () => {
    try {
      setError('');
      setTranscript('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await processAudio();
      };

      mediaRecorder.start();
      setIsListening(true);

      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, 10000);
    } catch (err: any) {
      const errorMsg = 'Impossible d\'accéder au microphone. Vérifiez les permissions.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      console.error('Microphone access error:', err);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      const errorMsg = 'Aucun audio enregistré';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setIsProcessing(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/azure-speech-stt`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: audioBlob,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la reconnaissance vocale');
      }

      const result = await response.json();
      const recognizedText = result.text || '';

      setTranscript(recognizedText);
      onResult(recognizedText);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de la reconnaissance vocale';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      console.error('Speech recognition error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={isProcessing}
        className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white shadow-lg`}
        title={
          isListening
            ? 'Arrêter l\'enregistrement'
            : isProcessing
            ? 'Traitement en cours...'
            : 'Démarrer la recherche vocale'
        }
      >
        {isProcessing ? (
          <Loader className="w-6 h-6 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>

      {isListening && (
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-red-400 animate-ping" />
      )}

      {(transcript || error) && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-64 bg-white rounded-lg shadow-xl p-4 z-10">
          {transcript && (
            <div className="text-sm text-gray-900">
              <p className="font-semibold mb-1">Résultat :</p>
              <p>{transcript}</p>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600">
              <p className="font-semibold mb-1">Erreur :</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      )}

      {isListening && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-64 bg-white rounded-lg shadow-xl p-4 z-10">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" />
              <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse delay-75" />
              <div className="w-1 h-8 bg-red-500 rounded-full animate-pulse delay-100" />
              <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse delay-75" />
              <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" />
            </div>
            <p className="text-sm text-gray-600">En écoute...</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">{placeholder}</p>
        </div>
      )}
    </div>
  );
}
