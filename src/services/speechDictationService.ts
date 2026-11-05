/**
 * Sprachdiktat- und Audio-Transkriptionsdienst für das HBS App-Portal
 * Nutzt eine hybride Dual-Engine-Architektur:
 * 1. Web Speech API (Sofortige Live-Erkennung im Browser ohne Latenz und ohne API-Key)
 * 2. Cloudflare Workers AI - OpenAI Whisper (Hochpräzise KI-Transkription für komplexe Fachtexte)
 */

export interface DictationOptions {
  language?: 'de-DE' | 'en-US' | 'fr-FR' | 'es-ES';
  onInterimText?: (text: string) => void;
  onFinalText?: (text: string) => void;
  onError?: (errorMessage: string) => void;
}

export interface ActiveDictationSession {
  stop: () => Promise<string>;
  abort: () => void;
  engine: 'web-speech' | 'cloudflare-whisper' | 'hybrid';
}

/**
 * Prüft, ob im Browser Spracherkennung verfügbar ist
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition || 
    navigator.mediaDevices?.getUserMedia
  );
}

/**
 * Sendet eine Audiodatei an Cloudflare Workers AI Whisper zur Transkription
 */
export async function transcribeWithCloudflareWhisper(
  audioBlob: Blob,
  cfToken?: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': audioBlob.type || 'audio/webm'
  };
  if (cfToken) {
    headers['X-CF-Token'] = cfToken;
  }

  const res = await fetch('/api/cf-whisper', {
    method: 'POST',
    headers,
    body: audioBlob
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Transkription fehlgeschlagen (Status ${res.status})`);
  }

  const data = await res.json();
  return data.text?.trim() || '';
}

/**
 * Startet eine Sprachdiktat-Sitzung.
 * Kombiniert Live-Browsererkennung mit Audio-Aufnahme für Cloudflare Whisper.
 */
export async function startDictationSession(
  options: DictationOptions = {}
): Promise<ActiveDictationSession> {
  const language = options.language || 'de-DE';
  let fullTranscript = '';
  let recognition: any = null;
  let mediaRecorder: MediaRecorder | null = null;
  const audioChunks: Blob[] = [];

  // 1. Web Speech API initialisieren (für Live-Wort-für-Wort-Anzeige)
  const SpeechRecognitionClass = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition;

  if (SpeechRecognitionClass) {
    try {
      recognition = new SpeechRecognitionClass();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalStr += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }

        if (finalStr) {
          fullTranscript = (fullTranscript + ' ' + finalStr).replace(/\s+/g, ' ').trim();
          options.onFinalText?.(fullTranscript);
        } else if (interim) {
          const preview = (fullTranscript + ' ' + interim).replace(/\s+/g, ' ').trim();
          options.onInterimText?.(preview);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Web Speech API Hinweis:', e.error);
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('Konnte Web Speech API nicht starten:', e);
    }
  }

  // 2. Parallel Mikrofon-Stream für Cloudflare Whisper aufnehmen
  let mediaStream: MediaStream | null = null;
  if (navigator.mediaDevices?.getUserMedia) {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      mediaRecorder.start(250); // Alle 250ms Chunks sammeln
    } catch (micErr) {
      console.warn('Konnte Mikrofon-Stream nicht öffnen:', micErr);
    }
  }

  return {
    engine: recognition && mediaRecorder ? 'hybrid' : recognition ? 'web-speech' : 'cloudflare-whisper',
    stop: async (): Promise<string> => {
      // Stoppe Web Speech
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }

      // Stoppe Audio Recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          mediaRecorder!.onstop = () => resolve();
          mediaRecorder!.stop();
        });
      }

      // Mikrofon-Spuren freigeben
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      // Falls wir Audiodaten gesammelt haben: Versuche Cloudflare Whisper für maximale Genauigkeit
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: audioChunks[0].type || 'audio/webm' });
        try {
          const whisperText = await transcribeWithCloudflareWhisper(audioBlob);
          if (whisperText && whisperText.length > 0) {
            return whisperText;
          }
        } catch (cfErr) {
          console.info('Cloudflare Whisper nicht erreichbar oder kein Token, nutze Web Speech Text:', cfErr);
        }
      }

      return fullTranscript.trim();
    },
    abort: () => {
      if (recognition) {
        try { recognition.abort(); } catch {}
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch {}
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    }
  };
}
