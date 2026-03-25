import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSpeech(text: string, language: 'german' | 'english'): Promise<string | null> {
  try {
    const instruction = language === 'german' 
      ? `Say clearly in a professional German native speaker voice: ${text}`
      : `Say clearly in a professional English native speaker voice: ${text}`;
    
    const voiceName = language === 'german' ? 'Kore' : 'Puck';

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: instruction }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData && inlineData.data) {
      return inlineData.data;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}

// Keep the old function for backward compatibility but mark as deprecated or just wrap it
export async function generateGermanSpeech(text: string): Promise<string | null> {
  return generateSpeech(text, 'german');
}

let currentAudioSource: AudioBufferSourceNode | null = null;

export async function playPcmAudio(base64Data: string, sampleRate: number = 24000, speed: number = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (currentAudioSource) {
        currentAudioSource.stop();
        currentAudioSource = null;
      }

      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert 16-bit PCM to Float32
      const float32Data = new Float32Array(bytes.length / 2);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < float32Data.length; i++) {
        // Gemini TTS returns 16-bit signed little-endian PCM
        float32Data[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = audioCtx.createBuffer(1, float32Data.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speed;
      source.connect(audioCtx.destination);
      
      currentAudioSource = source;

      source.onended = () => {
        if (currentAudioSource === source) {
          currentAudioSource = null;
        }
        resolve();
      };
      
      source.start(0);
    } catch (error) {
      console.error("Error playing PCM audio:", error);
      reject(error);
    }
  });
}

export function stopPcmAudio() {
  if (currentAudioSource) {
    currentAudioSource.stop();
    currentAudioSource = null;
  }
}
