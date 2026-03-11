
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

interface VisionModeProps {
  apiKey: string;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// Helper to bold text wrapped in **
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;

  return (
    <div className="space-y-3 text-slate-600">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Handle Headers (### Header)
        if (trimmed.startsWith('### ')) {
            return <h3 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2 flex items-center">
                {parseBold(trimmed.substring(4))}
            </h3>
        }
        
        // Handle Headers (## Header)
        if (trimmed.startsWith('## ')) {
            return <h2 key={i} className="text-xl font-bold text-slate-800 mt-5 mb-3">{parseBold(trimmed.substring(3))}</h2>
        }

        // Handle Bullet Points (* item)
        if (trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start pl-1 mb-1">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 mr-3" />
              <span className="text-sm leading-relaxed">{parseBold(trimmed.substring(2))}</span>
            </div>
          );
        }

        // Regular Paragraph
        return <p key={i} className="leading-relaxed text-sm">{parseBold(line)}</p>;
      })}
    </div>
  );
};

const VisionMode: React.FC<VisionModeProps> = ({ apiKey }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setAnalysis(null);
        setMessages([]); // Reset chat
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    const key = process.env.API_KEY || apiKey;
    if (!selectedImage || !key) return;

    setIsLoading(true);
    setMessages([]); 
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const base64Data = selectedImage.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: [
            { 
                role: 'user', 
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: "Find me destinations in Africa that look like this." }
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

  const handleSendFollowUp = async () => {
    const key = process.env.API_KEY || apiKey;
    if (!inputValue.trim() || !key || !selectedImage || !analysis) return;

    const userText = inputValue;
    setInputValue('');
    setIsChatLoading(true);

    // Optimistic UI update
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);

    try {
        const ai = new GoogleGenAI({ apiKey: key });
        const base64Data = selectedImage.split(',')[1];

        // Reconstruct history to maintain context
        // Turn 1: Image + Prompt
        const history = [
            {
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: "Find me destinations in Africa that look like this." }
                ]
            },
            {
                role: 'model',
                parts: [{ text: analysis }]
            }
        ];

        // Append conversation history
        const chatHistory = newMessages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        const contents = [...history, ...chatHistory];

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: contents,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });

        const reply = response.text || "I didn't get that.";
        setMessages(prev => [...prev, { role: 'model', text: reply }]);

    } catch (error) {
        console.error("Chat Error", error);
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error responding to that." }]);
    } finally {
        setIsChatLoading(false);
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
                <p className="text-slate-500 mt-2">Identify landmarks or find similar destinations instantly.</p>
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
                                onClick={() => { setSelectedImage(null); setAnalysis(null); setMessages([]); }}
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
                        <div className="mb-6">
                            <FormattedText text={analysis} />
                        </div>

                        {/* Chat History */}
                        <div className="space-y-4 mb-6 pt-6 border-t border-brand-100/50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-brand-600 text-white rounded-br-sm' 
                                        : 'bg-white text-slate-700 shadow-sm border border-brand-100 rounded-bl-sm'
                                    }`}>
                                        <FormattedText text={msg.text} />
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                 <div className="flex justify-start">
                                    <div className="bg-white border border-brand-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center space-x-1">
                                        <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                 </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                className="w-full bg-white border border-brand-200 text-slate-800 placeholder-slate-400 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all shadow-sm"
                                placeholder="Ask about this image... (e.g. 'Find similar places in Africa')"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendFollowUp()}
                                disabled={isChatLoading}
                            />
                            <button
                                onClick={handleSendFollowUp}
                                disabled={!inputValue.trim() || isChatLoading}
                                className="absolute right-2 p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:bg-slate-300 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default VisionMode;
