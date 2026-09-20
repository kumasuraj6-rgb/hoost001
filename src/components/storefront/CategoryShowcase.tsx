import React from 'react';
import { Shield, Droplets, Package, ChevronRight, Layers, Award } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CategoryShowcase: React.FC = () => {
  const { setSelectedCategory, setActiveView } = useStore();

  const categories = [
    {
      title: 'Riding Jackets',
      category: 'Riding Jackets',
      description: 'CE Level 2 certified Knox & D3O armor with all-season rain/thermal liners.',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
      badge: 'CE Level 2',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      title: 'Riding Gloves',
      category: 'Riding Gloves',
      description: 'Full-grain goat leather with aerospace carbon knuckles & palm sliders.',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      badge: 'Carbon Fiber',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    {
      title: 'Monsoon Rain Suits',
      category: 'Full Rain Suits',
      description: '15,000mm waterproof hydrostatic head with heat-welded seams.',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
      badge: '15,000mm Waterproof',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      title: 'Touring Luggage & Tail Bags',
      category: 'Tail Bags',
      description: 'Heavy 500D PVC dry-duffels and magnetic tank bags for cross-country rides.',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      badge: 'IPX6 Submersible',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Armored Riding Pants',
      category: 'Riding Pants',
      description: 'Cordura 600D with CE Level 2 adjustable knee and hip protection.',
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
      badge: 'Cordura 1000D',
      badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
    },
    {
      title: 'Adventure Riding Boots',
      category: 'Riding Boots',
      description: 'CE 13634 certified with rigid steel anti-crush shank and waterproof liner.',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
      badge: 'CE Certified',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
  ];

  const handleSelect = (cat: string) => {
    setSelectedCategory(cat);
    setActiveView('CATALOG');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-14 bg-neutral-950 px-4 sm:px-6 lg:px-8 border-b border-neutral-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Approved Riding Equipment
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-100 mt-1">
              Engineered Collections
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setActiveView('CATALOG');
            }}
            className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1 self-start md:self-auto"
          >
            <span>View Complete Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((item) => (
            <div
              key={item.category}
              onClick={() => handleSelect(item.category)}
              className="group cursor-pointer relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-end h-64 p-6"
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-75"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />

              <div className="relative z-10 space-y-2">
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <h3 className="text-lg font-bold text-neutral-100 group-hover:text-amber-400 transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
