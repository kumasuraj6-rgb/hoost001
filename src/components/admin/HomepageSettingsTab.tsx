import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Image,
  Upload,
  Save,
  RotateCcw,
  Check,
  Eye,
  Megaphone,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { HomepageSettings, ALLOWED_CATEGORIES } from '../../types';
import { compressAndUploadImage } from '../../utils/imageUpload';

export const HomepageSettingsTab: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast, setActiveView } = useStore();

  const [homepage, setHomepage] = useState<HomepageSettings>({
    heroTitle: storeSettings.homepage?.heroTitle || 'Engineered For The Ride. Built For Protection.',
    heroSubtitle:
      storeSettings.homepage?.heroSubtitle ||
      'Equip yourself with premium touring jackets, abrasion-tested carbon leather gloves, heavy-duty submersible luggage, and seam-sealed rain protection built for Indian highways and extreme weather.',
    heroImageUrl:
      storeSettings.homepage?.heroImageUrl ||
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
    ctaText: storeSettings.homepage?.ctaText || 'Explore All Gear',
    ctaLink: storeSettings.homepage?.ctaLink || 'CATALOG',
    announcementBarText:
      storeSettings.homepage?.announcementBarText ||
      '⚡ FREE ALL-INDIA EXPRESS SHIPPING ON ORDERS OVER ₹1,999 • 100% GENUINE RIDING GEAR',
    showAnnouncementBar: storeSettings.homepage?.showAnnouncementBar ?? true,
    featuredCategories:
      storeSettings.homepage?.featuredCategories || [
        'Riding Jackets',
        'Riding Gloves',
        'Riding Boots',
        'Full Rain Suits',
        'Tail Bags',
      ],
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storeSettings.homepage) {
      setHomepage({
        heroTitle: storeSettings.homepage.heroTitle || 'Engineered For The Ride. Built For Protection.',
        heroSubtitle:
          storeSettings.homepage.heroSubtitle ||
          'Equip yourself with premium touring jackets, abrasion-tested carbon leather gloves, heavy-duty submersible luggage, and seam-sealed rain protection.',
        heroImageUrl:
          storeSettings.homepage.heroImageUrl ||
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
        ctaText: storeSettings.homepage.ctaText || 'Explore All Gear',
        ctaLink: storeSettings.homepage.ctaLink || 'CATALOG',
        announcementBarText:
          storeSettings.homepage.announcementBarText ||
          '⚡ FREE ALL-INDIA EXPRESS SHIPPING ON ORDERS OVER ₹1,999 • 100% GENUINE RIDING GEAR',
        showAnnouncementBar: storeSettings.homepage.showAnnouncementBar ?? true,
        featuredCategories: storeSettings.homepage.featuredCategories || [
          'Riding Jackets',
          'Riding Gloves',
          'Riding Boots',
          'Full Rain Suits',
          'Tail Bags',
        ],
      });
    }
  }, [storeSettings]);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processing and uploading hero image...', 'info');
      const uploadedUrl = await compressAndUploadImage(file);
      setHomepage((prev) => ({ ...prev, heroImageUrl: uploadedUrl }));
      showToast('Hero photo loaded and ready to save!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload hero image', 'error');
    }
  };

  const handleToggleCategory = (cat: string) => {
    setHomepage((prev) => {
      const exists = prev.featuredCategories.includes(cat);
      if (exists) {
        return {
          ...prev,
          featuredCategories: prev.featuredCategories.filter((c) => c !== cat),
        };
      } else {
        return {
          ...prev,
          featuredCategories: [...prev.featuredCategories, cat],
        };
      }
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = updateStoreSettings({
      homepage,
      brandTagline: homepage.heroTitle,
    });
    setTimeout(() => {
      setIsSaving(false);
      if (success) {
        showToast('Storefront homepage updated successfully!', 'success');
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Storefront Visual Merchandising</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Homepage & Storefront Settings
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Customize the customer homepage hero banner title, subtitle, backdrop photograph, call-to-action
            button, top announcement ticker, and featured category showcases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('HOME')}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Live Home</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Homepage'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Announcement Bar */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>Top Announcement Bar Ticker</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-300">
                <span>Display Ticker</span>
                <input
                  type="checkbox"
                  checked={homepage.showAnnouncementBar}
                  onChange={(e) =>
                    setHomepage((prev) => ({ ...prev, showAnnouncementBar: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Ticker Text Message</label>
              <input
                type="text"
                value={homepage.announcementBarText}
                onChange={(e) =>
                  setHomepage((prev) => ({ ...prev, announcementBarText: e.target.value }))
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
                placeholder="⚡ FREE ALL-INDIA EXPRESS SHIPPING ON ORDERS OVER ₹1,999 • 100% GENUINE RIDING GEAR"
              />
              <span className="text-[10px] text-neutral-500">
                Appears on the very top of all storefront pages for customer awareness.
              </span>
            </div>
          </div>

          {/* Hero Banner Details */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <Image className="w-4 h-4 text-amber-500" />
              <span>Hero Banner Content</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Hero Headline / Title *
              </label>
              <input
                type="text"
                required
                value={homepage.heroTitle}
                onChange={(e) => setHomepage((prev) => ({ ...prev, heroTitle: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                placeholder="Engineered For The Ride. Built For Protection."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Hero Subtitle / Description *
              </label>
              <textarea
                rows={3}
                required
                value={homepage.heroSubtitle}
                onChange={(e) => setHomepage((prev) => ({ ...prev, heroSubtitle: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none leading-relaxed"
                placeholder="Equip yourself with premium touring jackets, abrasion-tested carbon leather gloves..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">CTA Button Text</label>
                <input
                  type="text"
                  value={homepage.ctaText}
                  onChange={(e) => setHomepage((prev) => ({ ...prev, ctaText: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="Explore All Gear"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">CTA Target View</label>
                <select
                  value={homepage.ctaLink}
                  onChange={(e) => setHomepage((prev) => ({ ...prev, ctaLink: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="CATALOG">Catalog (All Riding Gear)</option>
                  <option value="HOME">Home</option>
                  <option value="Full Rain Suits">Full Rain Suits Collection</option>
                  <option value="Riding Jackets">Riding Jackets</option>
                  <option value="Tail Bags">Tail Bags & Luggage</option>
                </select>
              </div>
            </div>

            {/* Hero Image Management */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300">Hero Image</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={homepage.heroImageUrl}
                  onChange={(e) =>
                    setHomepage((prev) => ({ ...prev, heroImageUrl: e.target.value }))
                  }
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="Paste hero image URL..."
                />
                <label className="cursor-pointer px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-neutral-700 shrink-0">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Featured Categories Selection */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Featured Categories Showcase
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Select which allowed riding categories are featured directly on the storefront homepage.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ALLOWED_CATEGORIES.map((cat) => {
                const isSelected = homepage.featuredCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`p-3 rounded-xl border text-xs text-left font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="truncate pr-1">{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Live Visual Preview</span>
            </h3>

            {/* Simulated Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 group">
              <img
                src={homepage.heroImageUrl}
                alt="Hero banner preview"
                className="w-full h-48 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 flex flex-col justify-end">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  {storeSettings.brandName}
                </div>
                <div className="text-sm font-black text-white uppercase leading-tight line-clamp-2 mt-0.5">
                  {homepage.heroTitle}
                </div>
                <div className="text-[10px] text-neutral-300 line-clamp-2 mt-1">
                  {homepage.heroSubtitle}
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase">
                    <span>{homepage.ctaText}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Announcement preview */}
            {homepage.showAnnouncementBar && (
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase">
                  Ticker
                </span>
                <span className="truncate">{homepage.announcementBarText}</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
