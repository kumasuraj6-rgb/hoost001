import React from 'react';
import { Shield, Sparkles, ArrowRight, CheckCircle, Droplets, Wind, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';

export const Hero: React.FC = () => {
  const { storeSettings, setSelectedCategory, setActiveView } = useStore();

  const handleExploreCategory = (cat: string) => {
    setSelectedCategory(cat);
    setActiveView('CATALOG');
  };

  return (
    <div className="relative overflow-hidden bg-neutral-950 border-b border-neutral-800">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>Certified CE Level 2 Armor • Monsoon 15,000mm Rated</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-neutral-100 leading-[1.08]">
              {storeSettings.homepage?.heroTitle || storeSettings.brandTagline || 'Engineered For The Ride. Built For Protection.'}
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-xl">
              {storeSettings.homepage?.heroSubtitle ||
                'Equip yourself with premium touring jackets, abrasion-tested carbon leather gloves, heavy-duty submersible luggage, and seam-sealed rain protection built for Indian highways and extreme weather.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  const target = storeSettings.homepage?.ctaLink || 'CATALOG';
                  if (target === 'CATALOG' || target === 'HOME') {
                    setSelectedCategory(null);
                    setActiveView(target as any);
                  } else {
                    handleExploreCategory(target);
                  }
                }}
                className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                id="hero-explore-btn"
              >
                <span>{storeSettings.homepage?.ctaText || 'Explore All Gear'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleExploreCategory('Full Rain Suits')}
                className="px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold text-sm tracking-wide uppercase transition-colors flex items-center gap-2"
                id="hero-rain-gear-btn"
              >
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>Monsoon Collection</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-900 text-xs">
              <div className="space-y-1">
                <div className="font-extrabold text-neutral-200 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>CE EN1621</span>
                </div>
                <div className="text-neutral-400">Knox & D3O Certified Armor</div>
              </div>
              <div className="space-y-1">
                <div className="font-extrabold text-neutral-200 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-blue-400" />
                  <span>Cordura 600D</span>
                </div>
                <div className="text-neutral-400">High-Abrasion Shells</div>
              </div>
              <div className="space-y-1">
                <div className="font-extrabold text-neutral-200 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>IPX6 Dry</span>
                </div>
                <div className="text-neutral-400">Electro-welded Luggage</div>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Visual Bento Box */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl group">
              <img
                src={
                  storeSettings.homepage?.heroImageUrl ||
                  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80'
                }
                alt="Motorcycle touring gear in action"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                      New Season Touring
                    </span>
                    <h3 className="text-base font-bold text-neutral-100">AeroTour Series 2</h3>
                  </div>
                  <button
                    onClick={() => handleExploreCategory('Riding Jackets')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
                  >
                    View Jackets
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  CE Level 2 elbow, shoulder & spinal armor with dual rain + thermal detachable liners.
                </p>
              </div>
            </div>

            {/* Floating Spec Tag */}
            <div className="absolute -top-4 -left-4 hidden sm:flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl shadow-xl text-xs font-semibold text-neutral-200">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Tested on Himalayan Altitudes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
