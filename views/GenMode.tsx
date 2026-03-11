
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface GenModeProps {
  apiKey: string;
}

const GenMode: React.FC<GenModeProps> = ({ apiKey: defaultApiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    // Logic: Use 'gemini-2.5-flash-image' for 1K (Free tier friendly).
    // Use 'gemini-3-pro-image-preview' for 2K/4K (Requires Billing/Paid Key).
    const isHighRes = imageSize === '2K' || imageSize === '4K';
    const modelName = isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    try {
      // Only strictly enforce key selection for the Pro model as per requirements
      if (isHighRes) {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
            const hasKey = await aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await aistudio.openSelectKey();
            }
        }
      }
      
      const apiKeyToUse = process.env.API_KEY || defaultApiKey;
      
      if (!apiKeyToUse) {
          throw new Error("No API Key available. Please select a key.");
      }

      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      
      // Construct config based on model capabilities
      const config: any = {
        imageConfig: {
            aspectRatio: '1:1'
        }
      };

      // imageSize is only supported by the Pro Image Preview model
      if (isHighRes) {
          config.imageConfig.imageSize = imageSize;
      }
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
            { role: 'user', parts: [{ text: prompt }] }
        ],
        config: config
      });

      let foundImage = false;
      const parts = response.candidates?.[0]?.content?.parts;
      
      if (parts) {
          for (const part of parts) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
                setGeneratedImage(imageUrl);
                foundImage = true;
                break;
            }
          }
      }

      if (!foundImage) {
          const finishReason = response.candidates?.[0]?.finishReason;
          if (finishReason) {
              setError(`Generation blocked by safety filters (${finishReason}). Try a different prompt.`);
          } else {
              setError("No image generated. The model returned an empty response.");
          }
      }

    } catch (err: any) {
      console.error("Image Gen Error:", err);
      
      let errorMessage = err.message || "An unknown error occurred";

      // Parse JSON error if present
      if (errorMessage.includes('{"error":')) {
          try {
              const jsonStart = errorMessage.indexOf('{');
              const jsonEnd = errorMessage.lastIndexOf('}') + 1;
              const jsonStr = errorMessage.substring(jsonStart, jsonEnd);
              const parsed = JSON.parse(jsonStr);
              if (parsed.error && parsed.error.message) {
                  errorMessage = parsed.error.message;
              }
          } catch (e) {
              // Ignore parse error
          }
      }

      // Handle Permission Denied
      if (
          errorMessage.includes("PERMISSION_DENIED") || 
          errorMessage.includes("403") || 
          errorMessage.includes("The caller does not have permission") ||
          errorMessage.includes("Requested entity was not found")
      ) {
          // If we failed on High Res, suggest switching to 1K
          if (isHighRes) {
               setError("High-resolution generation requires a paid API key. Try switching to '1K' quality for free generation.");
               // Attempt to open key selector
               const aistudio = (window as any).aistudio;
               if (aistudio) {
                   try { await aistudio.openSelectKey(); } catch(e) {}
               }
               return;
          } else {
               // If we failed on standard, still try to prompt for key
               const aistudio = (window as any).aistudio;
               if (aistudio) {
                   try { 
                       await aistudio.openSelectKey(); 
                       setError("Permission denied. Please select a valid API Key.");
                       return;
                   } catch(e) {}
               }
          }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Controls */}
        <div className="p-8 md:w-5/12 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
          <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Imagine</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Describe your dream destination or dish, and watch Voya visualize it in high definition.</p>
          </div>

          <div className="flex-1 space-y-6">
              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Prompt</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., A futuristic eco-hotel in Bali, sunset, photorealistic 8k..." 
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 h-40 focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all resize-none shadow-sm text-slate-700 placeholder-slate-400"
                  />
              </div>

              <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Quality</label>
                    <span className="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                        {imageSize === '1K' ? 'Free Tier' : 'Pro (Paid)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['1K', '2K', '4K'] as const).map((size) => (
                        <button
                            key={size}
                            onClick={() => setImageSize(size)}
                            className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                imageSize === size 
                                ? 'bg-slate-900 text-white shadow-md transform scale-[1.02]' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                  </div>
              </div>
          </div>

          <div className="mt-8">
            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full py-4 bg-gradient-to-r from-brand-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-glow hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
            >
                {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
            {error && <div className="mt-4 text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-lg border border-red-100 leading-snug">{error}</div>}
          </div>
        </div>

        {/* Preview Area */}
        <div className="md:w-7/12 bg-slate-100/50 flex items-center justify-center p-8 relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
             
             {!generatedImage ? (
                 <div className="text-center relative z-10">
                     <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-6">
                         <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                     </div>
                     <h3 className="text-slate-900 font-semibold text-lg">Ready to Create</h3>
                     <p className="text-slate-400 text-sm mt-1">Your generated masterpiece will appear here.</p>
                 </div>
             ) : (
                 <div className="relative w-full h-full flex items-center justify-center z-10 animate-fade-in">
                    <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-4 ring-white" 
                    />
                    <a 
                        href={generatedImage} 
                        download="voya-creation.png"
                        className="absolute bottom-6 right-6 bg-white/20 hover:bg-white/40 text-white p-3 rounded-xl backdrop-blur-md transition border border-white/30"
                        title="Download"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </a>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default GenMode;
