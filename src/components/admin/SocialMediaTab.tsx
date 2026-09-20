import React, { useState, useEffect } from 'react';
import {
  Share2,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  MessageSquare,
  Send,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Shield,
  Eye,
  Smartphone,
  Save,
  RotateCcw,
  AlertCircle,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreSettings } from '../../types';

interface SocialChannelDef {
  id: string;
  name: string;
  key: keyof StoreSettings;
  placeholder: string;
  description: string;
  badge: string;
  badgeColor: string;
  brandColor: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultHandle?: string;
  type: 'url' | 'phone';
}

const CHANNELS: SocialChannelDef[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    key: 'instagram',
    placeholder: 'https://instagram.com/ridexgear',
    description: 'Rider community photos, crash-test reels, and gear launches.',
    badge: 'Primary Visual',
    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    brandColor: 'text-pink-400',
    icon: Instagram,
    defaultHandle: '@ridexgear',
    type: 'url',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    key: 'youtube',
    placeholder: 'https://youtube.com/@ridexgear',
    description: 'Armored jacket teardowns, CE level reviews, and touring guides.',
    badge: 'Video Reviews',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    brandColor: 'text-red-400',
    icon: Youtube,
    defaultHandle: '@ridexgear',
    type: 'url',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Support',
    key: 'whatsapp',
    placeholder: '+91 98450 12345',
    description: 'Direct 1-on-1 rider gear sizing, fitment advice & live dispatch updates.',
    badge: 'Instant Support',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    brandColor: 'text-emerald-400',
    icon: MessageSquare,
    defaultHandle: '+91 98450 12345',
    type: 'phone',
  },
  {
    id: 'whatsappChannel',
    name: 'WhatsApp Channel',
    key: 'whatsappChannel' as keyof StoreSettings,
    placeholder: 'https://whatsapp.com/channel/0029VaRideXMoto',
    description: 'Official verified broadcast channel for flash sales and ride alerts.',
    badge: 'Broadcast Hub',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20',
    brandColor: 'text-green-400',
    icon: Radio,
    defaultHandle: 'RideX Moto Official',
    type: 'url',
  },
  {
    id: 'facebook',
    name: 'Facebook Page',
    key: 'facebook',
    placeholder: 'https://facebook.com/ridexgear',
    description: 'Brand page for touring club events, customer reviews and announcements.',
    badge: 'Community',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    brandColor: 'text-blue-400',
    icon: Facebook,
    defaultHandle: '/ridexgear',
    type: 'url',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    key: 'twitter',
    placeholder: 'https://x.com/ridexgear',
    description: 'Real-time updates, customer support tweets, and highway event alerts.',
    badge: 'Real-Time',
    badgeColor: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    brandColor: 'text-neutral-200',
    icon: Twitter,
    defaultHandle: '@ridexgear',
    type: 'url',
  },
  {
    id: 'telegram',
    name: 'Telegram Community',
    key: 'telegram' as keyof StoreSettings,
    placeholder: 'https://t.me/ridexgear',
    description: 'Rider chat group, high-altitude route updates & drop notifications.',
    badge: 'Rider Group',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    brandColor: 'text-sky-400',
    icon: Send,
    defaultHandle: 't.me/ridexgear',
    type: 'url',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Company',
    key: 'linkedin',
    placeholder: 'https://linkedin.com/company/ridex-protective-equipment',
    description: 'Corporate profile, protective materials research, and careers.',
    badge: 'Corporate',
    badgeColor: 'bg-blue-600/10 text-blue-400 border-blue-600/20',
    brandColor: 'text-blue-400',
    icon: Linkedin,
    defaultHandle: 'ridex-protective-equipment',
    type: 'url',
  },
  {
    id: 'discord',
    name: 'Discord Lounge',
    key: 'discord' as keyof StoreSettings,
    placeholder: 'https://discord.gg/ridexlounge',
    description: 'Voice lounges for group rides, moto-vlogging, and gear discussions.',
    badge: 'Voice Lounge',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    brandColor: 'text-indigo-400',
    icon: Globe,
    defaultHandle: 'discord.gg/ridexlounge',
    type: 'url',
  },
];

export const SocialMediaTab: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast, setActiveView } = useStore();

  const [formData, setFormData] = useState<StoreSettings>({ ...storeSettings });
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  useEffect(() => {
    setFormData({ ...storeSettings });
  }, [storeSettings]);

  const enabledMap = formData.socialLinksEnabled || {
    instagram: true,
    youtube: true,
    facebook: true,
    twitter: true,
    linkedin: true,
    whatsapp: true,
    whatsappChannel: true,
    telegram: true,
    discord: false,
    pinterest: false,
  };

  const handleToggleChannel = (channelId: string) => {
    const updated = {
      ...enabledMap,
      [channelId]: !enabledMap[channelId],
    };
    setFormData((prev) => ({
      ...prev,
      socialLinksEnabled: updated,
    }));
  };

  const handleInputChange = (key: keyof StoreSettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCopy = (text: string, channelId: string) => {
    if (!text) {
      showToast('No link configured to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedChannel(channelId);
    showToast(`Copied ${text} to clipboard`, 'success');
    setTimeout(() => setCopiedChannel(null), 2500);
  };

  const handleTestLink = (channel: SocialChannelDef) => {
    const rawVal = formData[channel.key] as string;
    if (!rawVal) {
      showToast(`Please enter a valid link for ${channel.name} before testing`, 'error');
      return;
    }

    if (channel.type === 'phone') {
      const cleanPhone = rawVal.replace(/\D/g, '');
      const preset = encodeURIComponent(formData.whatsappMessagePreset || 'Hello RideX Moto!');
      window.open(`https://wa.me/${cleanPhone}?text=${preset}`, '_blank', 'noopener,noreferrer');
    } else {
      const url = rawVal.startsWith('http') ? rawVal : `https://${rawVal}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const success = updateStoreSettings(formData);
      if (success) {
        showToast('Social media links and preferences saved & synced to live store!', 'success');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all social links and channel settings to default recommendations?')) {
      const defaults: Partial<StoreSettings> = {
        instagram: 'https://instagram.com/ridexgear',
        facebook: 'https://facebook.com/ridexgear',
        youtube: 'https://youtube.com/@ridexgear',
        twitter: 'https://x.com/ridexgear',
        linkedin: 'https://linkedin.com/company/ridex-protective-equipment',
        whatsappChannel: 'https://whatsapp.com/channel/0029VaRideXMoto',
        telegram: 'https://t.me/ridexgear',
        discord: 'https://discord.gg/ridexlounge',
        whatsapp: '+91 98450 12345',
        socialLinksEnabled: {
          instagram: true,
          facebook: true,
          youtube: true,
          twitter: true,
          linkedin: true,
          whatsapp: true,
          whatsappChannel: true,
          telegram: true,
          discord: false,
          pinterest: false,
        },
        enableFloatingWhatsApp: true,
        whatsappMessagePreset: 'Hello RideX Moto! I need advice choosing riding gear and sizing.',
        socialHeaderDisplay: true,
      };
      setFormData((prev) => ({ ...prev, ...defaults }));
      updateStoreSettings(defaults);
      showToast('Restored default official social channels', 'info');
    }
  };

  const visibleChannels = CHANNELS.filter((c) => {
    if (!filterActiveOnly) return true;
    return enabledMap[c.id] !== false;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
            <Share2 className="w-4 h-4" />
            <span>Admin Ops / Channel Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Social Media & Communication Links
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Link and manage your official Instagram, YouTube channel, WhatsApp support, Telegram community,
            and biker forums. Changes update the storefront footer, top announcement bar, and floating support widget instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="reset-social-defaults-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('HOME')}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Preview on live customer storefront"
            id="view-storefront-social-btn"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Storefront</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            id="save-social-links-btn"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving & Syncing...' : 'Save & Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Storefront Display Function Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Function 1: Floating WhatsApp Widget */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200 text-xs uppercase tracking-wide">
                Floating WhatsApp Chat
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    enableFloatingWhatsApp: !prev.enableFloatingWhatsApp,
                  }))
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  formData.enableFloatingWhatsApp !== false ? 'bg-emerald-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    formData.enableFloatingWhatsApp !== false ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              Displays a floating 1-click WhatsApp widget on the bottom corner of every storefront page for rider queries.
            </p>
          </div>
        </div>

        {/* Function 2: Header Social Display */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200 text-xs uppercase tracking-wide">
                Header Bar Social Icons
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    socialHeaderDisplay: !prev.socialHeaderDisplay,
                  }))
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  formData.socialHeaderDisplay !== false ? 'bg-amber-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    formData.socialHeaderDisplay !== false ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              Shows quick icon links (Instagram, YouTube, WhatsApp) in the top announcement bar next to customer support.
            </p>
          </div>
        </div>

        {/* Function 3: Cloud Sync Indicator */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200 text-xs uppercase tracking-wide">
                Database Cloud Sync
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              All social links sync with Google Firestore (`settings/global`) and are cached locally for lightning-fast loads.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp Inbound Preset Customizer (if enabled) */}
      {formData.enableFloatingWhatsApp !== false && (
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                WhatsApp Inbound Message Preset
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">Pre-filled rider chat template</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="md:col-span-2">
              <input
                type="text"
                value={formData.whatsappMessagePreset || ''}
                onChange={(e) => handleInputChange('whatsappMessagePreset', e.target.value)}
                placeholder="e.g. Hello RideX Moto! I need advice choosing riding gear and sizing."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  const cleanPhone = (formData.whatsapp || '+91 98450 12345').replace(/\D/g, '');
                  const preset = encodeURIComponent(
                    formData.whatsappMessagePreset || 'Hello RideX Moto! I need advice on sizing.'
                  );
                  window.open(`https://wa.me/${cleanPhone}?text=${preset}`, '_blank', 'noopener,noreferrer');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test WhatsApp Inbound Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Overview */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Available Channels ({CHANNELS.length})
          </span>
          <span className="text-xs text-neutral-400">|</span>
          <span className="text-xs text-amber-400 font-mono">
            {Object.values(enabledMap).filter(Boolean).length} Active on Storefront
          </span>
        </div>

        <button
          type="button"
          onClick={() => setFilterActiveOnly(!filterActiveOnly)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
            filterActiveOnly
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {filterActiveOnly ? 'Showing Active Only' : 'Show All Channels'}
        </button>
      </div>

      {/* Channels List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleChannels.map((channel) => {
          const Icon = channel.icon;
          const isEnabled = enabledMap[channel.id] !== false;
          const currentValue = (formData[channel.key] as string) || '';

          return (
            <div
              key={channel.id}
              className={`p-5 rounded-2xl border transition-all ${
                isEnabled
                  ? 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                  : 'bg-neutral-950/60 border-neutral-900 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/50 ${channel.brandColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-100 text-sm">{channel.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${channel.badgeColor}`}>
                        {channel.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{channel.description}</p>
                  </div>
                </div>

                {/* Enable/Disable Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleChannel(channel.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    isEnabled ? 'bg-amber-500' : 'bg-neutral-800'
                  }`}
                  title={isEnabled ? 'Click to disable' : 'Click to enable'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Input & Action Buttons */}
              <div className="space-y-2 text-xs">
                <div className="relative flex items-center">
                  <input
                    type={channel.type === 'phone' ? 'text' : 'url'}
                    value={currentValue}
                    onChange={(e) => handleInputChange(channel.key, e.target.value)}
                    placeholder={channel.placeholder}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-20 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono text-[11px]"
                  />

                  {/* Actions inside input right-side */}
                  <div className="absolute right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(currentValue, channel.id)}
                      disabled={!currentValue}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors disabled:opacity-30 cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedChannel === channel.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTestLink(channel)}
                      disabled={!currentValue}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors disabled:opacity-30 cursor-pointer"
                      title="Test Link in New Tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Handle / Quick suggestion */}
                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5">
                  <span>
                    Status:{' '}
                    {isEnabled ? (
                      <span className="text-emerald-400 font-medium">Visible on Storefront</span>
                    ) : (
                      <span className="text-neutral-400">Hidden from customers</span>
                    )}
                  </span>
                  {channel.defaultHandle && (
                    <button
                      type="button"
                      onClick={() => handleInputChange(channel.key, channel.placeholder)}
                      className="text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      Auto-fill: {channel.defaultHandle}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Storefront Preview Component */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Interactive Storefront Preview
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Real-time rendering of how customers will see your social media channels in the footer and top bar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>

        {/* Mock Footer Preview Box */}
        <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 space-y-5">
          <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
            Preview: Customer Storefront Footer ({storeSettings.brandName})
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
            <div>
              <div className="font-black text-sm uppercase tracking-wider text-neutral-100 flex items-center gap-2">
                <span>{formData.brandName}</span>
                <span className="text-[10px] text-amber-400 font-mono px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                  OFFICIAL
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-md">
                {formData.footerDescription || formData.brandDescription}
              </p>
            </div>

            {/* Social Icons Strip Preview */}
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400 mb-2">Connect With Riders</div>
              <div className="flex flex-wrap items-center gap-2">
                {formData.instagram && enabledMap.instagram !== false && (
                  <a
                    href={formData.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-pink-600/20 text-pink-400 border border-neutral-800 hover:border-pink-500/40 transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {formData.youtube && enabledMap.youtube !== false && (
                  <a
                    href={formData.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-red-600/20 text-red-400 border border-neutral-800 hover:border-red-500/40 transition-colors"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {formData.whatsapp && enabledMap.whatsapp !== false && (
                  <a
                    href={`https://wa.me/${formData.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-emerald-600/20 text-emerald-400 border border-neutral-800 hover:border-emerald-500/40 transition-colors"
                    title="WhatsApp Support"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                )}
                {formData.whatsappChannel && enabledMap.whatsappChannel !== false && (
                  <a
                    href={formData.whatsappChannel}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-green-600/20 text-green-400 border border-neutral-800 hover:border-green-500/40 transition-colors"
                    title="WhatsApp Channel"
                  >
                    <Radio className="w-4 h-4" />
                  </a>
                )}
                {formData.facebook && enabledMap.facebook !== false && (
                  <a
                    href={formData.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-blue-600/20 text-blue-400 border border-neutral-800 hover:border-blue-500/40 transition-colors"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {formData.twitter && enabledMap.twitter !== false && (
                  <a
                    href={formData.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-colors"
                    title="Twitter / X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {formData.telegram && enabledMap.telegram !== false && (
                  <a
                    href={formData.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-sky-600/20 text-sky-400 border border-neutral-800 hover:border-sky-500/40 transition-colors"
                    title="Telegram Community"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                )}
                {formData.linkedin && enabledMap.linkedin !== false && (
                  <a
                    href={formData.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-blue-600/20 text-blue-400 border border-neutral-800 hover:border-blue-500/40 transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {formData.discord && enabledMap.discord !== false && (
                  <a
                    href={formData.discord}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-indigo-600/20 text-indigo-400 border border-neutral-800 hover:border-indigo-500/40 transition-colors"
                    title="Discord Lounge"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Floating WhatsApp indicator preview */}
          {formData.enableFloatingWhatsApp !== false && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold shadow-md">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-neutral-200 font-medium">Floating WhatsApp Widget</span>
                  <span className="text-[10px] text-neutral-400 block">
                    Target: {formData.whatsapp || '+91 98450 12345'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE IN BOTTOM CORNER
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
