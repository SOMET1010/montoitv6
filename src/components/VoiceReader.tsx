import { useState } from 'react';
import { Volume2, VolumeX, Loader } from 'lucide-react';
import { azureSpeechService } from '../services/azure/azureSpeechService';

interface VoiceReaderProps {
  text: string;
  language?: string;
  voice?: string;
  className?: string;
}

export default function VoiceReader({
  text,
  language = 'fr-FR',
  voice = 'fr-FR-DeniseNeural',
  className = ''
}: VoiceReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const audioUrl = await azureSpeechService.textToSpeech(text, language, voice);

      const newAudio = new Audio(audioUrl);
      newAudio.onended = () => {
        setIsPlaying(false);
        setAudio(null);
      };

      await newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isPlaying ? 'Arrêter la lecture' : 'Lire le texte'}
    >
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {isLoading ? 'Chargement...' : isPlaying ? 'Arrêter' : 'Écouter'}
      </span>
    </button>
  );
}
