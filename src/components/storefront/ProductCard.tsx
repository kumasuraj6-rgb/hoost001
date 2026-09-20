import React, { useState } from 'react';
import { Heart, Shield, Star, Droplets, Check, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetail }) => {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const isWishlisted = wishlist.includes(product.id);

  // Active preview color & dynamic image
  const defaultColor = product.colorVariants?.[0]?.colorName || product.colors?.[0] || 'Default';
  const [selectedColor, setSelectedColor] = useState<string>(defaultColor);

  // Derive thumbnail for selected color
  const activeVariant = product.colorVariants?.find((c) => c.colorName === selectedColor);
  const displayImage =
    activeVariant?.images?.[0]?.url ||
    product.colorVariants?.[0]?.images?.[0]?.url ||
    product.masterImages?.[0]?.url ||
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80';

  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className="group relative rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 transition-all duration-300 flex flex-col overflow-hidden shadow-lg"
      id={`product-card-${product.id}`}
    >
      {/* Image Stage */}
      <div
        className="relative h-64 sm:h-72 w-full bg-neutral-950 overflow-hidden cursor-pointer"
        onClick={() => onOpenDetail(product)}
      >
        <img
          src={displayImage}
          alt={`${product.name} in ${selectedColor}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent pointer-events-none" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.armorLevel && product.armorLevel !== 'None' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
              <Shield className="w-3 h-3 text-amber-500" />
              <span>{product.armorLevel}</span>
            </span>
          )}

          {product.discountPercentage > 0 && (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-sm">
              {product.discountPercentage}% OFF
            </span>
          )}

          {product.waterproofRating && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md text-blue-400 border border-blue-500/30">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span>Waterproof</span>
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-colors z-10 ${
            isWishlisted
              ? 'bg-red-600 text-white'
              : 'bg-neutral-950/60 text-neutral-300 hover:text-white hover:bg-neutral-900'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Stock Alert Badge */}
        {isLowStock && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
            Low Stock: Only {product.stock} Left
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-800 backdrop-blur-sm">
            Sold Out
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-amber-500">{product.brand}</span>
            <span className="truncate">{product.category}</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onOpenDetail(product)}
            className="text-sm sm:text-base font-bold text-neutral-100 group-hover:text-amber-400 transition-colors line-clamp-2 cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="ml-1 font-bold text-neutral-200">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-neutral-500">({product.reviewCount} verified reviews)</span>
          </div>

          {/* Color Dots with Instant Image Switch */}
          {product.colorVariants && product.colorVariants.length > 0 && (
            <div className="pt-1 flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400 mr-1">Colors:</span>
              <div className="flex items-center gap-1.5">
                {product.colorVariants.map((variant) => (
                  <button
                    key={variant.id || variant.colorName}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColor(variant.colorName);
                    }}
                    onMouseEnter={() => setSelectedColor(variant.colorName)}
                    title={variant.colorName}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      selectedColor === variant.colorName
                        ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-neutral-900 border-white scale-110'
                        : 'border-neutral-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: variant.colorHex || '#1c1917' }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-neutral-400 truncate max-w-[90px] ml-1">
                {selectedColor}
              </span>
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-neutral-100">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="text-[10px] text-neutral-400">Inclusive of 18% GST</div>
          </div>

          <button
            onClick={() => onOpenDetail(product)}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-amber-500 text-neutral-200 hover:text-black text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shrink-0"
            id={`view-gear-btn-${product.id}`}
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
