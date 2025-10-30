import { serviceProviderFactory, ServiceResponse } from '../providers/serviceProviderFactory';

export interface SpeechToTextOptions {
  language?: string;
  enablePunctuation?: boolean;
  enableDiarization?: boolean;
}

export interface TextToSpeechOptions {
  voice?: string;
  language?: string;
  speakingRate?: number;
  pitch?: number;
}

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

class AzureSpeechService {
  async speechToText(
    audioData: Blob | ArrayBuffer,
    options: SpeechToTextOptions = {}
  ): Promise<ServiceResponse<SpeechRecognitionResult>> {
    const {
      language = 'fr-FR',
      enablePunctuation = true,
      enableDiarization = false,
    } = options;

    return serviceProviderFactory.callWithFallback(
      'speech_recognition',
      'speech_to_text',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const region = provider.keys.region || 'eastus';
        const endpoint = provider.keys.endpoint || `https://${region}.stt.speech.microsoft.com`;

        const audioBuffer = audioData instanceof Blob
          ? await audioData.arrayBuffer()
          : audioData;

        const response = await fetch(
          `${endpoint}/speech/recognition/conversation/cognitiveservices/v1?language=${language}`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'audio/wav',
            },
            body: audioBuffer,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Speech STT error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (result.RecognitionStatus !== 'Success') {
          throw new Error(`Speech recognition failed: ${result.RecognitionStatus}`);
        }

        const tokens = result.NBest[0].Display.split(' ').length;
        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'speech_recognition',
          'speech_to_text',
          tokens,
          tokens * 0.5,
          tokens * 0.001,
          { language, duration: result.Duration }
        );

        return {
          text: result.NBest[0].Display,
          confidence: result.NBest[0].Confidence,
          language: result.NBest[0].Lexical,
          duration: result.Duration,
        };
      },
      { enableFallback: false, maxRetries: 2 }
    );
  }

  async textToSpeech(
    text: string,
    options: TextToSpeechOptions = {}
  ): Promise<ServiceResponse<Blob>> {
    const {
      voice = 'fr-FR-DeniseNeural',
      language = 'fr-FR',
      speakingRate = 1.0,
      pitch = 1.0,
    } = options;

    return serviceProviderFactory.callWithFallback(
      'speech_synthesis',
      'text_to_speech',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const region = provider.keys.region || 'eastus';
        const endpoint = provider.keys.endpoint || `https://${region}.tts.speech.microsoft.com`;

        const ssml = `
          <speak version='1.0' xml:lang='${language}'>
            <voice xml:lang='${language}' name='${voice}'>
              <prosody rate='${speakingRate}' pitch='${pitch > 1 ? '+' : ''}${(pitch - 1) * 50}%'>
                ${this.escapeXml(text)}
              </prosody>
            </voice>
          </speak>
        `;

        const response = await fetch(
          `${endpoint}/cognitiveservices/v1`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'application/ssml+xml',
              'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
            },
            body: ssml,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Speech TTS error: ${response.status} - ${errorText}`);
        }

        const audioBlob = await response.blob();

        const characters = text.length;
        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'speech_synthesis',
          'text_to_speech',
          characters,
          characters * 0.008,
          characters * 0.000016,
          { voice, language, textLength: characters }
        );

        return audioBlob;
      },
      { enableFallback: false, maxRetries: 2 }
    );
  }

  async getAvailableVoices(language: string = 'fr-FR'): Promise<ServiceResponse<Array<{
    name: string;
    displayName: string;
    gender: string;
    locale: string;
  }>>> {
    return serviceProviderFactory.callWithFallback(
      'speech_synthesis',
      'get_voices',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const region = provider.keys.region || 'eastus';
        const endpoint = provider.keys.endpoint || `https://${region}.tts.speech.microsoft.com`;

        const response = await fetch(
          `${endpoint}/cognitiveservices/voices/list`,
          {
            method: 'GET',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get voices: ${response.status}`);
        }

        const voices = await response.json();

        const filteredVoices = voices
          .filter((v: any) => v.Locale.startsWith(language.split('-')[0]))
          .map((v: any) => ({
            name: v.ShortName,
            displayName: v.DisplayName,
            gender: v.Gender,
            locale: v.Locale,
          }));

        return filteredVoices;
      },
      { enableFallback: false }
    );
  }

  async recognizeFromMicrophone(
    options: SpeechToTextOptions = {}
  ): Promise<ServiceResponse<SpeechRecognitionResult>> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      return new Promise((resolve) => {
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const result = await this.speechToText(audioBlob, options);
          resolve(result);
        };

        mediaRecorder.start();

        setTimeout(() => {
          mediaRecorder.stop();
        }, 10000);
      });
    } catch (error: any) {
      return {
        success: false,
        error: `Microphone access denied: ${error.message}`,
      };
    }
  }

  async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onended = () => resolve();
      audio.onerror = (error) => reject(error);
      audio.play();
    });
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const azureSpeechService = new AzureSpeechService();
