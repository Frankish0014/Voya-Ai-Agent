import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

interface VisionModeProps {
  apiKey: string;
}

const VisionMode: React.FC<VisionModeProps> = ({ apiKey }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !apiKey) return;

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = selectedImage.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: [
            { 
                role: 'user', 
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: "Analyze this image. If it's a menu, translate items and recommend the best value. If it's a place, identify it and show availability based on your data." }
                ] 
            }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      setAnalysis(response.text || "Could not analyze image.");
    } catch (error) {
      console.error(error);
      setAnalysis("Error processing image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
            <div className="p-8 text-center border-b border-slate-50 bg-gradient-to-b from-brand-50/50 to-white">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 text-brand-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Visual Intelligence</h2>
                <p className="text-slate-500 mt-2">Identify landmarks or decode menus instantly.</p>
            </div>
            
            <div className="p-8 space-y-8">
                <div className="flex flex-col items-center justify-center">
                    {!selectedImage ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-brand-300 transition-all duration-300 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-sm transition">
                                <svg className="w-8 h-8 text-slate-400 group-hover:text-brand-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-slate-600 font-medium group-hover:text-slate-900 transition">Upload Photo</span>
                            <span className="text-slate-400 text-sm mt-1">Click to browse</span>
                        </div>
                    ) : (
                        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-100 group">
                            <img src={selectedImage} alt="Upload" className="w-full h-auto max-h-[500px] object-cover bg-slate-900" />
                            <button 
                                onClick={() => { setSelectedImage(null); setAnalysis(null); }}
                                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white text-slate-700 shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*"
                    />
                </div>

                {selectedImage && !analysis && (
                    <button
                        onClick={analyzeImage}
                        disabled={isLoading}
                        className="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center"
                    >
                        {isLoading ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Scanning...
                             </>
                        ) : 'Analyze Photo'}
                    </button>
                )}

                {analysis && (
                    <div className="animate-slide-up bg-brand-50/50 border border-brand-100 rounded-2xl p-6">
                        <h3 className="text-brand-800 font-bold mb-3 flex items-center text-lg">
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Analysis
                        </h3>
                        <div className="prose prose-slate text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {analysis}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default VisionMode;