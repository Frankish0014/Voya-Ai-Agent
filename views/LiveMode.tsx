
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { SYSTEM_INSTRUCTION } from '../constants';

interface LiveModeProps {
  apiKey: string;
}

const LiveMode: React.FC<LiveModeProps> = ({ apiKey: defaultApiKey }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false); 
  const [volume, setVolume] = useState(0); 
  
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<Promise<any> | null>(null);

  const stopSession = async () => {
    setIsConnected(false);
    setIsTalking(false);
    
    // 1. Close Session (Stop receiving data)
    if (sessionRef.current) {
        const currentSessionPromise = sessionRef.current;
        sessionRef.current = null; // Prevent reuse
        try {
            const session = await currentSessionPromise;
            session.close();
        } catch (e) {
            console.debug("Session close ignored or failed", e);
        }
    }

    // 2. Stop Microphone Tracks
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    
    // 3. Close Audio Contexts safely
    const safeClose = async (ctx: AudioContext | null) => {
        if (ctx && ctx.state !== 'closed') {
            try {
                await ctx.close();
            } catch (e) {
                 // Ignore "Cannot close a closed AudioContext" errors
            }
        }
    };
    
    await safeClose(inputContextRef.current);
    await safeClose(outputContextRef.current);
    inputContextRef.current = null;
    outputContextRef.current = null;
    
    // 4. Disconnect Nodes
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
  };

  const startSession = async () => {
    // 1. Validate API Key
    const apiKey = process.env.API_KEY || defaultApiKey;
    if (!apiKey) {
        alert("API Key is required to use Live Mode.");
        return;
    }

    // Ensure we start fresh
    await stopSession();

    try {
      // 2. Request Microphone Permission FIRST
      // If this fails, we haven't created any AudioContexts yet, keeping state clean.
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Microphone access is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
      });
      streamRef.current = stream;

      // 3. Initialize Audio Contexts
      // We do this after getting the stream to ensure we have permission.
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      // 4. Connect to Gemini Live API
      const ai = new GoogleGenAI({ apiKey });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + "\n Speak briefly and clearly.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
        callbacks: {
          onopen: async () => {
            console.log('Live Session Opened');
            setIsConnected(true);
            
            // Ensure context is running (sometimes it starts suspended)
            if (inputCtx.state === 'suspended') await inputCtx.resume();
            if (outputCtx.state === 'suspended') await outputCtx.resume();

            // Setup Audio Processing Graph
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              // Visualizer Volume
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(rms * 100);

              // Send to Model
              if (sessionRef.current) {
                  sessionRef.current.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                  }).catch(err => {
                     // Silently fail if session isn't ready
                  });
              }
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
            
            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsTalking(true);
              const audioBytes = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(audioBytes, outputCtx);
              
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              const now = outputCtx.currentTime;
              const startTime = Math.max(now, nextStartTimeRef.current);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              
              source.onended = () => {
                 if (outputCtx.currentTime >= nextStartTimeRef.current - 0.1) {
                     setIsTalking(false);
                 }
              };
            }

            if (msg.serverContent?.interrupted) {
                console.log("Model interrupted");
                nextStartTimeRef.current = 0;
                setIsTalking(false);
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
            stopSession();
          },
          onerror: (err) => {
            console.error("Session Error:", err);
            setIsConnected(false);
            stopSession();
          }
        }
      });
      
      sessionRef.current = sessionPromise;
      
      // Handle connection failure specifically
      sessionPromise.catch((err) => {
          console.error("Connection failed:", err);
          stopSession();
          alert(`Connection failed. Please check your API key. (${err.message})`);
      });

    } catch (err: any) {
      console.error("Failed to start session:", err);
      stopSession(); // Cleanup
      
      if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
          alert("Microphone permission denied. \n\nPlease click the lock icon in your browser address bar and allow Microphone access for this site.");
      } else if (err.name === 'NotFoundError') {
          alert("No microphone found. Please connect a microphone.");
      } else {
          alert(`Error: ${err.message}`);
      }
    }
  };

  useEffect(() => {
    return () => { stopSession(); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
      <div className="relative group">
        {/* Ambient Glow */}
        <div className={`absolute inset-0 bg-brand-400 rounded-full blur-[60px] opacity-10 transition-all duration-1000 ${isConnected ? 'scale-150 opacity-20' : ''}`}></div>

        {/* Pulsing Rings */}
        <div className={`absolute inset-0 rounded-full border border-brand-200 opacity-0 transition-all duration-1000 ${isConnected ? 'animate-ping opacity-30' : ''}`} style={{ animationDuration: '2s' }}></div>
        <div className={`absolute inset-4 rounded-full border border-brand-300 opacity-0 transition-all duration-1000 ${isConnected ? 'animate-ping opacity-40' : ''}`} style={{ animationDelay: '0.3s', animationDuration: '2s' }}></div>
        
        {/* Main Interaction Button */}
        <button
          onClick={isConnected ? stopSession : startSession}
          className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 transform hover:scale-105 active:scale-95 ${
            isConnected 
              ? 'bg-white text-rose-500 ring-4 ring-rose-50 shadow-rose-200' 
              : 'bg-slate-900 text-white ring-8 ring-slate-100 shadow-slate-200'
          }`}
        >
          {isConnected ? (
             <svg className="w-12 h-12 mb-1" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
             </svg>
          ) : (
             <svg className="w-12 h-12 mb-1 ml-1" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                 <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
             </svg>
          )}
          <span className="font-semibold text-sm tracking-wide">{isConnected ? 'End' : 'Talk'}</span>
        </button>
      </div>

      <div className="mt-16 text-center max-w-sm px-6">
        <h3 className={`text-2xl font-bold transition-colors duration-300 ${isTalking ? 'text-brand-600' : 'text-slate-800'}`}>
            {isConnected ? (isTalking ? "Voya is speaking..." : "Listening...") : "Live Voice Mode"}
        </h3>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            {isConnected 
             ? "Experience real-time, fluid conversation." 
             : "Tap the button to start a natural voice chat with your travel assistant."}
        </p>
      </div>
      
      {/* Audio Visualizer */}
      <div className={`mt-10 flex items-end justify-center space-x-2 h-16 transition-opacity duration-500 ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
          {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-3 rounded-full transition-all duration-100 ease-in-out ${isTalking ? 'bg-brand-500' : 'bg-slate-300'}`}
                style={{ 
                    height: isTalking 
                        ? `${20 + Math.random() * 80}%` 
                        : `${15 + Math.max(0, Math.min(85, volume * (i + 1) * 2))}%` 
                }}
              ></div>
          ))}
      </div>
    </div>
  );
};

export default LiveMode;
