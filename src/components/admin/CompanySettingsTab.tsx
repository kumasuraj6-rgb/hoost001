import React, { useState, useEffect } from 'react';
import {
  Building2,
  Image,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  Check,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Shield,
  Eye,
  Percent,
  Truck,
  MapPin,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreSettings } from '../../types';
import { formatINR } from '../../utils/currency';
import { compressAndUploadImage } from '../../utils/imageUpload';

export const CompanySettingsTab: React.FC = () => {
  const { storeSettings, updateStoreSettings, resetStoreSettings, showToast } = useStore();

  // Local form state
  const [formData, setFormData] = useState<StoreSettings>({ ...storeSettings });
  const [activeSubTab, setActiveSubTab] = useState<'BRAND' | 'COMPANY' | 'SOCIAL' | 'FINANCE' | 'FOOTER' | 'POLICIES'>('BRAND');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({ ...storeSettings });
  }, [storeSettings]);

  const handleInputChange = (field: keyof StoreSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Processing and uploading logo...', 'info');
      const uploadedUrl = await compressAndUploadImage(file);
      setFormData((prev) => ({ ...prev, brandLogo: uploadedUrl }));
      showToast('Logo updated and ready to save!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload logo', 'error');
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, brandLogo: '' }));
    showToast('Brand logo cleared.', 'info');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateStoreSettings(formData);
      setIsSaving(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Admin Panel / Store Configuration
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Company & Brand Settings
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Centralized settings update the storefront header, brand titles, footer, contact links, GSTIN,
            and invoices across the entire application instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset all brand and store settings to initial defaults?')) {
                resetStoreSettings();
                setFormData(storeSettings);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            id="save-company-settings-btn"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-neutral-800 gap-2 sm:gap-6 overflow-x-auto text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveSubTab('BRAND')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'BRAND'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Brand Information
        </button>

        <button
          onClick={() => setActiveSubTab('COMPANY')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'COMPANY'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Legal & Tax (GSTIN)
        </button>

        <button
          onClick={() => setActiveSubTab('FINANCE')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'FINANCE'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Currency & Shipping
        </button>

        <button
          onClick={() => setActiveSubTab('SOCIAL')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'SOCIAL'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Social Channels
        </button>

        <button
          onClick={() => setActiveSubTab('FOOTER')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'FOOTER'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Footer Texts
        </button>

        <button
          onClick={() => setActiveSubTab('POLICIES')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'POLICIES'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Legal Policies
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SUBTAB 1: BRAND INFORMATION & LOGO */}
        {activeSubTab === 'BRAND' && (
          <div className="space-y-6">
            {/* Logo Manager */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <Image className="w-4 h-4 text-amber-500" />
                <span>Brand Logo & Favicon</span>
              </h3>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Live Logo Preview */}
                <div className="w-24 h-24 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden p-2 relative group shadow-inner">
                  {formData.brandLogo ? (
                    <img
                      src={formData.brandLogo}
                      alt="Brand Logo"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Shield className="w-10 h-10 text-neutral-600" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center gap-2 border border-neutral-700">
                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                      <span>Upload Logo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {formData.brandLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-red-800/80"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-neutral-400 text-[11px]">Or Paste Logo Image URL</label>
                    <input
                      type="url"
                      value={formData.brandLogo}
                      onChange={(e) => handleInputChange('brandLogo', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Core Brand Names */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
                Brand Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={(e) => handleInputChange('brandName', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-400">Displayed in Navbar, Title & Hero</span>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Short Brand Name</label>
                  <input
                    type="text"
                    value={formData.shortBrandName}
                    onChange={(e) => handleInputChange('shortBrandName', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-neutral-400 font-medium">Brand Tagline</label>
                  <input
                    type="text"
                    value={formData.brandTagline}
                    onChange={(e) => handleInputChange('brandTagline', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-neutral-400 font-medium">Brand Description</label>
                  <textarea
                    rows={3}
                    value={formData.brandDescription}
                    onChange={(e) => handleInputChange('brandDescription', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Official Brand Email</label>
                  <input
                    type="email"
                    value={formData.brandEmail}
                    onChange={(e) => handleInputChange('brandEmail', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Customer Support Email</label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Support Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Support WhatsApp Number</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: LEGAL & GSTIN */}
        {activeSubTab === 'COMPANY' && (
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Registered Business & Taxation Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Legal Registered Name (for Invoices)</label>
                <input
                  type="text"
                  value={formData.companyLegalName}
                  onChange={(e) => handleInputChange('companyLegalName', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">GSTIN (Goods and Services Tax ID) *</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono uppercase focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Permanent Account Number (PAN) *</label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono uppercase focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-neutral-400 font-medium">Registered Office Address</label>
                <input
                  type="text"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">PIN Code</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: CURRENCY & SHIPPING */}
        {activeSubTab === 'FINANCE' && (
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Financial & Delivery Settings</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Currency Code (Strict Mandate: INR)</label>
                <input
                  type="text"
                  disabled
                  value={formData.currency}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-400 font-mono cursor-not-allowed opacity-80"
                />
                <span className="text-[10px] text-neutral-400">Strictly locked to INR per project rules</span>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Currency Symbol</label>
                <input
                  type="text"
                  disabled
                  value={formData.currencySymbol}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-400 font-mono cursor-not-allowed opacity-80"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Standard GST Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={formData.defaultGSTRate}
                  onChange={(e) => handleInputChange('defaultGSTRate', Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Flat Delivery Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.flatDeliveryCharge}
                  onChange={(e) => handleInputChange('flatDeliveryCharge', Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-neutral-400 font-medium">
                  Free Shipping Minimum Threshold (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.freeShippingThreshold}
                  onChange={(e) => handleInputChange('freeShippingThreshold', Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400">
                  Cart orders above {formatINR(formData.freeShippingThreshold)} will automatically receive
                  free express shipping.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: SOCIAL CHANNELS */}
        {activeSubTab === 'SOCIAL' && (
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-500" />
                  <span>Official Social Media & Community Channels</span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Configure primary URLs. For advanced channel toggles and floating WhatsApp chat settings, use the dedicated Social & Channels Hub tab.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Instagram Profile URL</label>
                <input
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="https://instagram.com/ridexgear"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">YouTube Channel URL</label>
                <input
                  type="url"
                  value={formData.youtube}
                  onChange={(e) => handleInputChange('youtube', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="https://youtube.com/@ridexgear"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">WhatsApp Broadcast Channel</label>
                <input
                  type="url"
                  value={formData.whatsappChannel || ''}
                  onChange={(e) => handleInputChange('whatsappChannel', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="https://whatsapp.com/channel/..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Telegram Rider Community</label>
                <input
                  type="url"
                  value={formData.telegram || ''}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="https://t.me/ridexgear"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Facebook Page URL</label>
                <input
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="https://facebook.com/ridexgear"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Twitter / X Profile URL</label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="https://x.com/ridexgear"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">LinkedIn Company URL</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Discord Server / Lounge</label>
                <input
                  type="url"
                  value={formData.discord || ''}
                  onChange={(e) => handleInputChange('discord', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="https://discord.gg/..."
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: FOOTER TEXTS */}
        {activeSubTab === 'FOOTER' && (
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
              Footer Text Configuration
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Footer Brand Paragraph</label>
                <textarea
                  rows={3}
                  value={formData.footerDescription}
                  onChange={(e) => handleInputChange('footerDescription', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Copyright String</label>
                <input
                  type="text"
                  value={formData.copyrightText}
                  onChange={(e) => handleInputChange('copyrightText', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Customer Support Note</label>
                <input
                  type="text"
                  value={formData.customerSupportText}
                  onChange={(e) => handleInputChange('customerSupportText', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 6: LEGAL POLICIES */}
        {activeSubTab === 'POLICIES' && (
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Customer & Compliance Policies</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Return & Size Exchange Policy</label>
                <textarea
                  rows={4}
                  value={formData.returnPolicy}
                  onChange={(e) => handleInputChange('returnPolicy', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Refund Policy</label>
                <textarea
                  rows={4}
                  value={formData.refundPolicy}
                  onChange={(e) => handleInputChange('refundPolicy', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Privacy Policy</label>
                <textarea
                  rows={3}
                  value={formData.privacyPolicy}
                  onChange={(e) => handleInputChange('privacyPolicy', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Terms and Conditions</label>
                <textarea
                  rows={3}
                  value={formData.termsAndConditions}
                  onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Sticky Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
          <div className="text-neutral-400">
            Changes will take effect immediately across all storefront headers, footers and product pages.
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
