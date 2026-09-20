import React, { useState } from 'react';
import {
  Shield,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  CreditCard,
  Truck,
  RotateCcw,
  CheckCircle2,
  FileText,
  Send,
  Radio,
  Globe,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';

export const Footer: React.FC = () => {
  const { storeSettings, setSelectedCategory, setActiveView, navigate } = useStore();
  const [activePolicyModal, setActivePolicyModal] = useState<string | null>(null);

  const handleCategoryNav = (cat: string) => {
    setSelectedCategory(cat);
    setActiveView('CATALOG');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 text-neutral-400 text-sm">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-neutral-900 py-8 px-4 sm:px-6 lg:px-8 bg-neutral-900/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-neutral-200 text-sm">CE Level 2 Certified</div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Authentic Knox Micro-Lock & D3O impact armor strictly compliant with EN1621 standards.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-neutral-200 text-sm">Free Express Shipping</div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Complimentary expedited delivery on all orders above {formatINR(storeSettings.freeShippingThreshold)}.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-neutral-200 text-sm">7-Day Size Exchange</div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Hassle-free doorstep size replacements to guarantee optimal riding posture fit.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-neutral-200 text-sm">Monsoon Waterproofing</div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Lab-tested 10,000mm to 15,000mm Reissa and PVC sealed membranes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Company Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              {storeSettings.brandLogo ? (
                <img
                  src={storeSettings.brandLogo}
                  alt={storeSettings.brandName}
                  className="h-9 w-9 object-cover rounded-lg border border-neutral-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
              )}
              <span className="text-lg font-black tracking-wider uppercase text-neutral-100">
                {storeSettings.brandName}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              {storeSettings.footerDescription || storeSettings.brandDescription}
            </p>

            <div className="pt-2 text-xs space-y-2 border-t border-neutral-900">
              <div className="font-semibold text-neutral-300">{storeSettings.companyLegalName}</div>
              <div className="text-neutral-500">
                GSTIN: <span className="text-neutral-300 font-mono">{storeSettings.gstin}</span> | PAN:{' '}
                <span className="text-neutral-300 font-mono">{storeSettings.pan}</span>
              </div>
            </div>

            {/* Social Links */}
            {(() => {
              const enabled = storeSettings.socialLinksEnabled || {
                instagram: true,
                youtube: true,
                facebook: true,
                twitter: true,
                linkedin: true,
                whatsapp: true,
                whatsappChannel: true,
                telegram: true,
                discord: false,
              };

              const cleanWhatsapp = (storeSettings.whatsapp || '').replace(/\D/g, '');

              return (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {storeSettings.instagram && enabled.instagram !== false && (
                    <a
                      href={storeSettings.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-pink-400 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="Instagram"
                      id="footer-social-instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {storeSettings.youtube && enabled.youtube !== false && (
                    <a
                      href={storeSettings.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="YouTube"
                      id="footer-social-youtube"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                  {storeSettings.whatsapp && enabled.whatsapp !== false && (
                    <a
                      href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                        storeSettings.whatsappMessagePreset || 'Hello RideX Moto!'
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="WhatsApp Rider Support"
                      id="footer-social-whatsapp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}
                  {storeSettings.whatsappChannel && enabled.whatsappChannel !== false && (
                    <a
                      href={storeSettings.whatsappChannel}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-green-400 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="WhatsApp Broadcast Channel"
                      id="footer-social-whatsapp-channel"
                    >
                      <Radio className="w-4 h-4" />
                    </a>
                  )}
                  {storeSettings.facebook && enabled.facebook !== false && (
                    <a
                      href={storeSettings.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="Facebook"
                      id="footer-social-facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {storeSettings.twitter && enabled.twitter !== false && (
                    <a
                      href={storeSettings.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="Twitter / X"
                      id="footer-social-twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {storeSettings.telegram && enabled.telegram !== false && (
                    <a
                      href={storeSettings.telegram}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="Telegram Community"
                      id="footer-social-telegram"
                    >
                      <Send className="w-4 h-4" />
                    </a>
                  )}
                  {storeSettings.linkedin && enabled.linkedin !== false && (
                    <a
                      href={storeSettings.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="LinkedIn"
                      id="footer-social-linkedin"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {storeSettings.discord && enabled.discord !== false && (
                    <a
                      href={storeSettings.discord}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 transition-colors border border-neutral-800/80"
                      title="Discord Community"
                      id="footer-social-discord"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-200">Riding Gear</div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleCategoryNav('Riding Jackets')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Armored Jackets
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Riding Gloves')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Carbon Leather Gloves
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Riding Pants')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Cordura Riding Pants
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Riding Boots')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Adventure Touring Boots
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Riding Protection')}
                  className="hover:text-amber-400 transition-colors"
                >
                  CE Armor Inserts & Vests
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Weather & Luggage */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-200">Monsoon & Luggage</div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleCategoryNav('Full Rain Suits')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Full Rain Suits
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Rain Jackets')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Monsoon Rain Jackets
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Tail Bags')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Dry Tail Bags
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Tank Bags')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Magnetic Tank Bags
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Saddlebags')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Waterproof Saddlebags
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Helpdesk */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-200">Helpdesk & Support</div>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  {storeSettings.businessAddress}, {storeSettings.city}, {storeSettings.state} - {storeSettings.pincode},{' '}
                  {storeSettings.country}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <a href={`tel:${storeSettings.phone}`} className="hover:text-amber-400 font-mono">
                  {storeSettings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <a href={`mailto:${storeSettings.supportEmail}`} className="hover:text-amber-400">
                  {storeSettings.supportEmail}
                </a>
              </li>
              {storeSettings.whatsapp && (
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <a
                    href={`https://wa.me/${storeSettings.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-400 font-mono"
                  >
                    WhatsApp Support
                  </a>
                </li>
              )}
              <li className="text-[11px] text-neutral-500 pt-1">{storeSettings.customerSupportText}</li>
            </ul>
          </div>
        </div>

        {/* Legal Policies Modal Triggers & Copyright */}
        <div className="mt-12 pt-6 border-t border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div>{storeSettings.copyrightText}</div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              onClick={() => setActivePolicyModal('RETURN')}
              className="hover:text-neutral-200 transition-colors underline-offset-4 hover:underline"
            >
              Return & Exchange Policy
            </button>
            <span className="text-neutral-700">•</span>
            <button
              onClick={() => setActivePolicyModal('REFUND')}
              className="hover:text-neutral-200 transition-colors underline-offset-4 hover:underline"
            >
              Refund Policy
            </button>
            <span className="text-neutral-700">•</span>
            <button
              onClick={() => setActivePolicyModal('PRIVACY')}
              className="hover:text-neutral-200 transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </button>
            <span className="text-neutral-700">•</span>
            <button
              onClick={() => setActivePolicyModal('TERMS')}
              className="hover:text-neutral-200 transition-colors underline-offset-4 hover:underline"
            >
              Terms & Safety Norms
            </button>
            <span className="text-neutral-700">•</span>
            <button
              onClick={() => navigate('/admin/login')}
              className="text-neutral-500 hover:text-amber-400 transition-colors font-medium flex items-center gap-1"
              id="footer-admin-login-link"
            >
              <span>Seller Hub & Ops</span>
            </button>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 text-neutral-200 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                {activePolicyModal === 'RETURN' && 'Return & Exchange Policy'}
                {activePolicyModal === 'REFUND' && 'Refund & Cancellation Policy'}
                {activePolicyModal === 'PRIVACY' && 'Privacy & Data Protection Policy'}
                {activePolicyModal === 'TERMS' && 'Terms of Service & Equipment Safety Norms'}
              </h3>
              <button
                onClick={() => setActivePolicyModal(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 text-xs leading-relaxed text-neutral-300 space-y-3">
              {activePolicyModal === 'RETURN' && <p>{storeSettings.returnPolicy}</p>}
              {activePolicyModal === 'REFUND' && <p>{storeSettings.refundPolicy}</p>}
              {activePolicyModal === 'PRIVACY' && <p>{storeSettings.privacyPolicy}</p>}
              {activePolicyModal === 'TERMS' && <p>{storeSettings.termsAndConditions}</p>}
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setActivePolicyModal(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
