import React, { useState } from 'react';
import { MessageSquare, X, Shield, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../context/StoreContext';

export const FloatingWhatsApp: React.FC = () => {
  const { storeSettings } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');

  if (storeSettings.enableFloatingWhatsApp === false) {
    return null;
  }

  const rawPhone = storeSettings.whatsapp || '+91 98450 12345';
  const cleanPhone = rawPhone.replace(/\D/g, '');

  const handleStartChat = (customMsg?: string) => {
    const textToSend =
      customMsg ||
      userQuery ||
      storeSettings.whatsappMessagePreset ||
      'Hello RideX Moto! I need sizing guidance and recommendations for riding gear.';
    const encoded = encodeURIComponent(textToSend);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const quickQuestions = [
    'Help me choose the right jacket size',
    'Are these gloves CE Level 2 certified?',
    'Track my recent gear dispatch',
    'Do you ship to Ladakh & North East?',
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="floating-whatsapp-widget">
      {/* Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="floating-whatsapp-popover"
            initial={{ opacity: 0, scale: 0.82, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15, transition: { duration: 0.2, ease: 'easeOut' } }}
            transition={{
              duration: 0.45,
              ease: [0.175, 0.885, 0.32, 1.275],
            }}
            style={{
              transformOrigin: 'bottom right',
              transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            className="whatsapp-popover mb-3 w-80 sm:w-96 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-wide">{storeSettings.brandName} Support</div>
                  <div className="text-[11px] text-emerald-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
                    <span>Rider Gear Specialists (Online)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-emerald-700 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 bg-neutral-950 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 space-y-1">
                <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Expert Sizing & Technical Help</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Hi rider! Connect directly with our gear techs for posture fitment, Knox armor queries, or monsoon weatherproofing advice.
                </p>
              </div>

              {/* Quick Questions Chips */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Popular Inquiries:</div>
                <div className="flex flex-col gap-1.5">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleStartChat(q)}
                      className="text-left py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 hover:text-amber-400 text-neutral-300 text-[11px] transition-colors border border-neutral-800/80 cursor-pointer flex items-center justify-between group"
                    >
                      <span>{q}</span>
                      <Send className="w-3 h-3 text-neutral-400 group-hover:text-amber-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Query Input */}
              <div className="pt-2 border-t border-neutral-900 flex items-center gap-2">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStartChat();
                  }}
                  placeholder="Type your question..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 text-xs focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleStartChat()}
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-colors cursor-pointer"
                  title="Send via WhatsApp"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        aria-label="Chat on WhatsApp"
        id="floating-whatsapp-btn"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-neutral-950"></span>
        </div>
        <span className="hidden sm:inline text-xs tracking-wide">Chat with Rider Support</span>
      </button>
    </div>
  );
};
