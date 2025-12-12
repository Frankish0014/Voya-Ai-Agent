
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { ChatMessage } from '../types';
import { SYSTEM_INSTRUCTION, MOCK_SERVICE_DATA } from '../constants';

interface HomeProps {
  apiKey: string;
}

// --- Booking Widget Component ---
interface BookingWidgetProps {
  itemName: string;
  priceEstimate: string;
  category: 'stay' | 'dining' | 'delivery' | 'service';
}

const BookingWidget: React.FC<BookingWidgetProps> = ({ itemName, priceEstimate, category }) => {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'confirmed'>('details');
  
  // Common State
  const [guests, setGuests] = useState(2);
  const [paymentName, setPaymentName] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  // Stay State
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Dining State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');

  // Delivery State
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Price Calculation Logic
  const basePrice = parseInt(priceEstimate.replace(/[^0-9]/g, '')) || 50;
  
  let total = basePrice;
  let summaryText = '';

  if (category === 'stay') {
     total = basePrice * 3; // Mock 3 nights
     summaryText = '3 Nights';
  } else if (category === 'dining') {
     total = basePrice * guests; // Mock price per head deposit
     summaryText = `${guests} Guests`;
  } else if (category === 'delivery') {
     total = basePrice; // Flat cart estimate
     summaryText = 'Delivery Order';
  } else if (category === 'service') {
     total = basePrice;
     summaryText = 'Service Fee';
  }

  const handleDetailsSubmit = () => {
    // Basic validation based on category
    if (category === 'stay' && (!checkIn || !checkOut)) return;
    if (category === 'dining' && (!date || !time)) return;
    if (category === 'delivery' && !address) return;
    
    setStep('payment');
  };

  const handlePaymentSubmit = () => {
    if (paymentName && cardNumber) {
      setStep('processing');
      setTimeout(() => {
        setStep('confirmed');
      }, 2500);
    }
  };

  // --- Render Helpers ---

  const renderIcon = () => {
      if (category === 'stay') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-3m-6 0h6" />;
      if (category === 'dining') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />;
      if (category === 'delivery') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />;
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />;
  };

  const getHeaderTitle = () => {
      if (category === 'stay') return 'Trip Details';
      if (category === 'dining') return 'Table Reservation';
      if (category === 'delivery') return 'Food Delivery';
      return 'Service Request';
  };

  const getThemeColor = () => {
      if (category === 'stay') return 'brand'; // Blue
      if (category === 'dining') return 'emerald'; // Green
      if (category === 'delivery') return 'amber'; // Orange
      return 'brand';
  };

  const theme = getThemeColor();
  const themeClasses = {
      bg: category === 'dining' ? 'bg-emerald-600' : category === 'delivery' ? 'bg-amber-600' : 'bg-brand-600',
      bgLight: category === 'dining' ? 'bg-emerald-50' : category === 'delivery' ? 'bg-amber-50' : 'bg-brand-50',
      text: category === 'dining' ? 'text-emerald-700' : category === 'delivery' ? 'text-amber-700' : 'text-brand-700',
      border: category === 'dining' ? 'focus:ring-emerald-200' : category === 'delivery' ? 'focus:ring-amber-200' : 'focus:ring-brand-200',
      btnHover: category === 'dining' ? 'hover:bg-emerald-700' : category === 'delivery' ? 'hover:bg-amber-700' : 'hover:bg-brand-700',
      confirmedBg: category === 'dining' ? 'bg-emerald-500' : category === 'delivery' ? 'bg-amber-500' : 'bg-brand-500',
  };

  if (step === 'processing') {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <div className="relative w-16 h-16">
           <div className={`absolute inset-0 border-4 border-slate-100 rounded-full`}></div>
           <div className={`absolute inset-0 border-4 ${themeClasses.text.replace('text', 'border')} rounded-full border-t-transparent animate-spin`}></div>
        </div>
        <p className="text-slate-600 font-medium animate-pulse">Processing secure booking...</p>
      </div>
    );
  }

  if (step === 'confirmed') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 animate-slide-up max-w-sm mx-auto">
        <div className={`${themeClasses.confirmedBg} p-6 text-white text-center`}>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">{renderIcon()}</svg>
            </div>
            <h3 className="text-xl font-bold">{category === 'delivery' ? 'Order Placed!' : 'Booking Confirmed!'}</h3>
            <p className="text-white/80 text-sm">Your request has been processed.</p>
        </div>
        <div className="p-6 space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-4">
                <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">{category === 'delivery' ? 'Provider' : 'Venue'}</p>
                    <p className="font-semibold text-slate-800 text-lg">{itemName}</p>
                </div>
            </div>
            
            {/* Conditional Summary Details */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                 {category === 'stay' && (
                     <>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Check-in</p>
                            <p className="text-slate-700">{checkIn || 'Oct 24'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Check-out</p>
                            <p className="text-slate-700">{checkOut || 'Oct 27'}</p>
                        </div>
                     </>
                 )}
                 {category === 'dining' && (
                     <>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Date</p>
                            <p className="text-slate-700">{date || 'Today'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Time</p>
                            <p className="text-slate-700">{time}</p>
                        </div>
                     </>
                 )}
                 {category === 'delivery' && (
                     <div className="col-span-2">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Delivery To</p>
                        <p className="text-slate-700 truncate">{address || 'Current Location'}</p>
                     </div>
                 )}
                 {category === 'service' && (
                     <div className="col-span-2">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Request</p>
                        <p className="text-slate-700 truncate">{orderNotes || 'Standard Service'}</p>
                     </div>
                 )}
            </div>

            <div className="flex justify-between items-center pt-2">
                <p className="text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-slate-900">${total}</p>
            </div>
            <button className="w-full mt-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition-colors text-sm">
                Download Receipt
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden animate-slide-up max-w-sm">
       {/* Header */}
       <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
          <span className="font-semibold text-slate-700">{step === 'details' ? getHeaderTitle() : 'Secure Payment'}</span>
          <span className={`text-xs font-bold px-2 py-1 ${themeClasses.bgLight} ${themeClasses.text} rounded-md uppercase tracking-wide`}>
              {step === 'details' ? 'Step 1/2' : 'Step 2/2'}
          </span>
       </div>

       {step === 'details' && (
         <div className="p-5 space-y-4">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{category === 'delivery' ? 'Ordering From' : 'Destination'}</label>
                <div className="text-lg font-medium text-slate-800 truncate">{itemName}</div>
                <div className={`text-sm ${themeClasses.text} font-medium`}>
                    {category === 'delivery' ? `Est. Total: $${total}` : `Est. ${priceEstimate} / ${category === 'stay' ? 'night' : 'person'}`}
                </div>
            </div>
            
            {/* STAY FORM */}
            {category === 'stay' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Check-in</label>
                        <input type="date" className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none`}
                            onChange={(e) => setCheckIn(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Check-out</label>
                        <input type="date" className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none`}
                            onChange={(e) => setCheckOut(e.target.value)} />
                    </div>
                </div>
            )}

            {/* DINING FORM */}
            {category === 'dining' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Date</label>
                        <input type="date" className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none`}
                            onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Time</label>
                        <input type="time" value={time} className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none`}
                            onChange={(e) => setTime(e.target.value)} />
                    </div>
                </div>
            )}

            {/* DELIVERY FORM */}
            {category === 'delivery' && (
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Delivery Address</label>
                        <input type="text" placeholder="Street, Apt, City" className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none`}
                            value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Order Notes / Items</label>
                        <textarea placeholder="e.g. 2 Pizzas, 1 Coke..." rows={2} className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none resize-none`}
                             value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
                    </div>
                </div>
            )}

            {/* SERVICE FORM */}
            {category === 'service' && (
                <div className="space-y-3">
                    <div>
                         <label className="text-xs text-slate-500 block mb-1">Date</label>
                        <input type="date" className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none`}
                            onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Request Details</label>
                        <textarea placeholder="Describe your request..." rows={2} className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none resize-none`}
                             value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
                    </div>
                </div>
            )}

            {/* Guests (Shared for Stay & Dining) */}
            {(category === 'stay' || category === 'dining') && (
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Guests</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                        <option value={1}>1 Person</option>
                        <option value={2}>2 People</option>
                        <option value={3}>3 People</option>
                        <option value={4}>4 People</option>
                        <option value={5}>5+ People</option>
                    </select>
                </div>
            )}

            <button 
                onClick={handleDetailsSubmit}
                className={`w-full py-3 ${themeClasses.bg} ${themeClasses.btnHover} text-white rounded-xl font-semibold shadow-md transition-all mt-2`}
            >
                Continue to Payment
            </button>
         </div>
       )}

       {step === 'payment' && (
           <div className="p-5 space-y-4">
               <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center mb-2">
                   <span className="text-sm text-slate-600">Total {category === 'stay' ? '(Est.)' : ''}</span>
                   <span className="font-bold text-slate-900 text-lg">${total}</span>
               </div>
               
               <div className="space-y-3">
                   <div>
                       <label className="text-xs text-slate-500 block mb-1">Cardholder Name</label>
                       <input type="text" placeholder="John Doe" className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none`}
                              value={paymentName} onChange={(e) => setPaymentName(e.target.value)} />
                   </div>
                   <div>
                       <label className="text-xs text-slate-500 block mb-1">Card Number</label>
                       <div className="relative">
                           <input type="text" placeholder="0000 0000 0000 0000" className={`w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 ${themeClasses.border} outline-none`}
                                  value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                           <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                       </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       <input type="text" placeholder="MM/YY" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                       <input type="text" placeholder="CVC" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                   </div>
               </div>

               <button 
                onClick={handlePaymentSubmit}
                disabled={!paymentName || !cardNumber}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 mt-2 flex items-center justify-center"
            >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {category === 'delivery' ? 'Place Order' : 'Pay & Book'}
            </button>
           </div>
       )}
    </div>
  );
};


// --- Main Home Component ---

// Custom Text Renderer to handle Markdown-like formatting (removing stars)
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;

  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Handle Bullet Points (* item)
        if (trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start pl-1">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 mr-3" />
              <span className="text-sm leading-relaxed">{parseBold(trimmed.substring(2))}</span>
            </div>
          );
        }

        // Handle Headers (### Header)
        if (trimmed.startsWith('### ')) {
            return <h3 key={i} className="text-base font-bold text-slate-800 pt-2">{parseBold(trimmed.substring(4))}</h3>
        }

        // Regular Paragraph
        return <p key={i} className="leading-relaxed">{parseBold(line)}</p>;
      })}
    </div>
  );
};

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

const Home: React.FC<HomeProps> = ({ apiKey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Welcome to **Voya**. \nI can help you find and book meals, stays, and services across Africa and the world.\n\n* "Order Jollof Rice via Jumia Food"\n* "Book a table at Slow Kigali"\n* "Find a hotel in Lagos"\n\n I am here to help you!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Tool Declaration for Booking
  const startBookingTool: FunctionDeclaration = {
    name: 'startBooking',
    description: 'Initiate the booking flow for a specific hotel, restaurant, or service.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'Type of booking: "stay" for hotels, "dining" for table reservations, "delivery" for food delivery/platforms, "service" for general/other.' },
        itemName: { type: Type.STRING, description: 'Name of the hotel, restaurant, or service (e.g., "Uber Eats", "Hilton").' },
        priceEstimate: { type: Type.STRING, description: 'Estimated price per night, per person, or total.' }
      },
      required: ['category', 'itemName']
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim() || !apiKey) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: `History: ${JSON.stringify(messages.slice(-6))}\nUser Request: ${userMsg.text}` }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }, { functionDeclarations: [startBookingTool] }] 
        }
      });

      // Handle Tool Calls
      const functionCalls = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
      
      if (functionCalls) {
         // If the model wants to start booking, we don't send a text response back immediately, 
         // we render the widget.
         if (functionCalls.name === 'startBooking') {
            const args = functionCalls.args as any;
            const itemName = args.itemName || "Selected Service";
            const price = args.priceEstimate || "$50";
            const category = (args.category as any) || 'stay';

            let actionText = 'Starting booking for';
            if (category === 'dining') actionText = 'Reserving table at';
            if (category === 'delivery') actionText = 'Starting order from';

            setMessages(prev => [...prev, { 
                role: 'model', 
                text: `${actionText} **${itemName}**...`,
                bookingPayload: { category, itemName, priceEstimate: price }
            }]);
            setIsLoading(false);
            return;
         }
      }

      const text = response.text || "I found some options. Would you like to proceed with a booking?";
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      setMessages(prev => [...prev, { role: 'model', text, groundingMetadata }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Network error. Please try again.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickActionChip = ({ icon, label, action }: { icon: React.ReactNode, label: string, action: string }) => (
    <button 
      onClick={() => setInputValue(action)} 
      className="flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full shadow-sm hover:bg-white hover:shadow-md hover:border-brand-200 transition-all duration-300 group whitespace-nowrap flex-shrink-0"
    >
      <span className="text-slate-400 group-hover:text-brand-500 transition-colors duration-300">{icon}</span>
      <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto">
      {/* Premium Widgets */}
      <div className="w-full overflow-x-auto no-scrollbar pt-2 pb-4 px-4 sm:px-6">
        <div className="flex md:grid md:grid-cols-3 gap-4 min-w-full snap-x snap-mandatory">
            {/* Widget 1 */}
            <div className="min-w-[85%] md:min-w-0 snap-center bg-white rounded-3xl p-5 shadow-soft border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-24 h-24 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dining</span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold text-slate-800">{MOCK_SERVICE_DATA.restaurants.length}</span>
                        <span className="text-sm text-slate-500">venues nearby</span>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Avg Wait: 13m
                    </div>
                </div>
            </div>

            {/* Widget 2 */}
            <div className="min-w-[85%] md:min-w-0 snap-center bg-white rounded-3xl p-5 shadow-soft border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-24 h-24 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stays</span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold text-slate-800">{MOCK_SERVICE_DATA.hotels.reduce((acc, h) => acc + h.rooms_available, 0)}</span>
                        <span className="text-sm text-slate-500">rooms open</span>
                    </div>
                     <div className="mt-4 flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-md">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        2 Locations
                    </div>
                </div>
            </div>

            {/* Widget 3 */}
            <div className="min-w-[85%] md:min-w-0 snap-center bg-white rounded-3xl p-5 shadow-soft border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-24 h-24 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transport</span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold text-slate-800">{MOCK_SERVICE_DATA.taxi.length}</span>
                        <span className="text-sm text-slate-500">drivers nearby</span>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-medium text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-md">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ETA: 2 min
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-8 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            {/* Model Icon */}
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-blue-500 flex items-center justify-center text-white shadow-md flex-shrink-0 mr-3 mt-1">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            )}
            
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-slate-850 text-white rounded-br-sm px-6 py-4' 
                : 'bg-white text-slate-600 rounded-bl-sm border border-slate-100 shadow-sm px-6 py-4'
            }`}>
              {/* Normal Text Content */}
              {msg.text && <FormattedText text={msg.text} />}

              {/* Booking Widget (Rendered if payload exists) */}
              {msg.bookingPayload && (
                  <div className="mt-4">
                      <BookingWidget 
                          category={msg.bookingPayload.category}
                          itemName={msg.bookingPayload.itemName} 
                          priceEstimate={msg.bookingPayload.priceEstimate} 
                      />
                  </div>
              )}
              
              {/* Grounding Sources with Book Buttons */}
              {msg.groundingMetadata?.groundingChunks && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Suggestions</div>
                  <div className="flex flex-col space-y-2">
                    {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                       if (chunk.web?.title) {
                           return (
                               <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-brand-200 transition-colors">
                                   <a href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline truncate max-w-[200px] sm:max-w-xs font-medium block">
                                       {chunk.web.title}
                                   </a>
                                   <button 
                                      onClick={() => handleSendMessage(`Book ${chunk.web.title}`)}
                                      className="ml-2 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-md hover:bg-brand-600 transition-colors"
                                   >
                                       Book
                                   </button>
                               </div>
                           )
                       }
                       return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
             <div className="w-8 h-8 mr-3" /> {/* Spacer for icon alignment */}
             <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-5 py-3 flex items-center space-x-2 shadow-sm">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-slate-50 to-transparent">
        <div className="max-w-4xl mx-auto space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                <QuickActionChip 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    label="Food Nearby"
                    action="Find highly rated restaurants nearby"
                />
                <QuickActionChip 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-3m-6 0h6" /></svg>}
                    label="Luxury Stays"
                    action="Find 5-star hotels in the city center"
                />
                <QuickActionChip 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                    label="Plan Trip"
                    action="Create a 3-day itinerary for this location"
                />
            </div>

            {/* Input Bar */}
            <div className="relative group">
                <div className="absolute inset-0 bg-brand-200 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative flex items-center bg-white rounded-full shadow-lg border border-slate-100 p-1.5 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                    <input
                        type="text"
                        className="flex-1 bg-transparent px-6 py-3 text-slate-800 placeholder-slate-400 focus:outline-none text-base"
                        placeholder="Ask Voya... (e.g., 'Book Uber Eats')"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !inputValue.trim()}
                        className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-md hover:bg-brand-600 disabled:opacity-50 disabled:bg-slate-300 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
