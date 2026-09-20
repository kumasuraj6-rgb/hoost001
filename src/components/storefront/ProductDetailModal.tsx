import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Shield,
  Star,
  Check,
  Truck,
  RotateCcw,
  Heart,
  ShoppingBag,
  Droplets,
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { Product, ProductImage } from '../../types';
import { formatINR } from '../../utils/currency';
import { useStore } from '../../context/StoreContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  return <ProductDetailModalContent product={product} onClose={onClose} />;
};

const ProductDetailModalContent: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const { storeSettings, addToCart, wishlist, toggleWishlist, setIsCartOpen, setActiveView } = useStore();

  // Selected Color state
  const initialColor = product.colorVariants?.[0]?.colorName || product.colors?.[0] || 'Standard';
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);

  // Selected Size state
  const initialSize = product.sizes?.[0] || 'Standard';
  const [selectedSize, setSelectedSize] = useState<string>(initialSize);

  // Quantity state
  const [quantity, setQuantity] = useState<number>(1);

  // Active Gallery: CRITICAL REQUIREMENT - DO NOT MIX IMAGES BETWEEN COLORS!
  // When customer selects a color, gallery immediately changes to that color's images!
  const activeColorVariant = useMemo(() => {
    return product.colorVariants?.find((cv) => cv.colorName === selectedColor);
  }, [product, selectedColor]);

  const activeGalleryImages: ProductImage[] = useMemo(() => {
    if (activeColorVariant && activeColorVariant.images && activeColorVariant.images.length > 0) {
      return activeColorVariant.images;
    }
    // Fallback only if this color variant has no specific images uploaded
    if (product.masterImages && product.masterImages.length > 0) {
      return product.masterImages;
    }
    return [
      {
        id: 'fallback-img',
        url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
        alt: product.name,
      },
    ];
  }, [activeColorVariant, product]);

  // Active Main Display Image & Zoom Lightbox state
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  // Whenever the color changes, reset image index to 0 and close zoom if open
  useEffect(() => {
    setActiveImageIndex(0);
    setIsZoomOpen(false);
  }, [selectedColor]);

  // Keyboard navigation for Zoom modal (Escape to close, Arrow keys to switch photos)
  useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomOpen(false);
      } else if (e.key === 'ArrowRight' && activeGalleryImages.length > 1) {
        setActiveImageIndex((prev) => (prev < activeGalleryImages.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft' && activeGalleryImages.length > 1) {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : activeGalleryImages.length - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen, activeGalleryImages.length]);

  const currentDisplayImage = activeGalleryImages[activeImageIndex] || activeGalleryImages[0];
  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedColor, selectedSize, currentDisplayImage.url, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedColor, selectedSize, currentDisplayImage.url, quantity);
    onClose();
    setActiveView('CHECKOUT');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              {product.brand || storeSettings.brandName}
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-xs text-neutral-400">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            id="close-product-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: COLOR-WISE IMAGE GALLERY (DO NOT MIX IMAGES) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Primary Large Image Stage with Zoom Trigger */}
              <div
                className="relative h-80 sm:h-96 lg:h-[430px] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 group cursor-zoom-in"
                onClick={() => setIsZoomOpen(true)}
                title="Click to zoom in"
              >
                <img
                  src={currentDisplayImage.url}
                  alt={currentDisplayImage.alt || `${product.name} - ${selectedColor}`}
                  className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Color Tag on Image */}
                <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-neutral-800 text-xs font-semibold text-neutral-200 pointer-events-none">
                  Showing: <span className="text-amber-400 font-bold">{selectedColor}</span>
                </div>

                {/* Armor / Waterproof Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-none">
                  {product.armorLevel && product.armorLevel !== 'None' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-neutral-950/90 backdrop-blur-md text-amber-400 border border-amber-500/30">
                      <Shield className="w-3.5 h-3.5" />
                      <span>{product.armorLevel}</span>
                    </span>
                  )}
                  {product.waterproofRating && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-neutral-950/90 backdrop-blur-md text-blue-400 border border-blue-500/30">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>{product.waterproofRating}</span>
                    </span>
                  )}
                </div>

                {/* Click to Zoom Badge Overlay */}
                <div className="absolute bottom-3 right-3 bg-neutral-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center gap-1.5 shadow-lg group-hover:border-amber-500/50 group-hover:text-amber-400 transition-all pointer-events-none">
                  <ZoomIn className="w-3.5 h-3.5 text-amber-500" />
                  <span>Click to zoom</span>
                </div>
              </div>

              {/* Color Specific Thumbnails */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>
                    Gallery for <strong className="text-neutral-200">{selectedColor}</strong> ({activeGalleryImages.length} photos)
                  </span>
                  <span className="text-[11px] text-neutral-500">Click photo to zoom/preview</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {activeGalleryImages.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-neutral-950 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105'
                          : 'border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt || `Angle ${idx + 1}`}
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Material & Spec Summary */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Technical Construction</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">{product.material}</p>
              </div>
            </div>

            {/* Right Column: Product Info, Selectors, Price, CTAs */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight">
                  {product.name}
                </h1>
                <div className="text-xs text-neutral-400 flex items-center gap-3">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 font-bold text-neutral-200">{product.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span>{product.reviewCount} customer reviews</span>
                  <span>•</span>
                  <span className="font-mono text-neutral-400">SKU: {product.sku}</span>
                </div>
              </div>

              {/* Price Block in INR */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-100">
                    {formatINR(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <>
                      <span className="text-sm text-neutral-400 line-through">
                        {formatINR(product.originalPrice)}
                      </span>
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                        {product.discountPercentage}% Instant Savings
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xs text-neutral-400 flex items-center justify-between pt-1">
                  <span>Inclusive of 18% GST</span>
                  <span className="text-emerald-400 font-medium">Free Express Delivery Included</span>
                </div>
              </div>

              {/* 1. COLOR SELECTOR (Dynamically switches images!) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-200 uppercase tracking-wider">
                    Select Color: <span className="text-amber-400">{selectedColor}</span>
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Switches gallery photo angles
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {product.colorVariants && product.colorVariants.length > 0 ? (
                    product.colorVariants.map((variant) => (
                      <button
                        key={variant.id || variant.colorName}
                        onClick={() => setSelectedColor(variant.colorName)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                          selectedColor === variant.colorName
                            ? 'bg-neutral-800 border-amber-500 text-amber-400 shadow-sm'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-neutral-700"
                          style={{ backgroundColor: variant.colorHex || '#262626' }}
                        />
                        <span>{variant.colorName}</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400">Standard</span>
                  )}
                </div>
              </div>

              {/* 2. SIZE SELECTOR */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-200 uppercase tracking-wider">
                    Select Size: <span className="text-amber-400">{selectedSize}</span>
                  </span>
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-500" />
                    Standard Indian Touring Fit
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-12 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                        selectedSize === sz
                          ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Stock */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-neutral-300">Quantity:</span>
                  <div className="flex items-center border border-neutral-800 rounded-lg bg-neutral-950">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-neutral-400 hover:text-white text-sm"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 font-bold text-neutral-100">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 py-1.5 text-neutral-400 hover:text-white text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  {product.stock > 0 ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      In Stock ({product.stock} units)
                    </span>
                  ) : (
                    <span className="text-red-400 font-semibold">Out of Stock</span>
                  )}
                </div>
              </div>

              {/* Actions: Add to Cart, Buy Now, Wishlist */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="w-full py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-100 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    id="modal-add-to-cart-btn"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                    <span>Add To Cart</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    id="modal-buy-now-btn"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Buy Now</span>
                  </button>
                </div>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isWishlisted
                      ? 'border-red-600/50 bg-red-950/30 text-red-400'
                      : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                  <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>

              {/* Safety & Delivery Assurances */}
              <div className="pt-4 border-t border-neutral-800 space-y-2.5 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>Dispatches within 24 hours from {storeSettings.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                  <span>7-Day Hassle-Free Size Replacement Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>1-Year Official Warranty on Armour & Zippers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Features & Specs Tabs */}
          <div className="mt-10 pt-8 border-t border-neutral-800 space-y-6">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-neutral-100 uppercase tracking-wider">
                Product Description
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed max-w-4xl">
                {product.description}
              </p>
            </div>

            {/* Features List */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">
                  Key Armor & Touring Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {product.features.map((feat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-300"
                    >
                      <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">
                  Technical Specifications
                </h3>
                <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950">
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, val], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? 'bg-neutral-900/40' : 'bg-neutral-950'}
                        >
                          <td className="p-3 font-semibold text-neutral-400 w-1/3 border-b border-neutral-800/60">
                            {key}
                          </td>
                          <td className="p-3 text-neutral-200 border-b border-neutral-800/60 font-mono">
                            {val}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen High-Resolution Image Zoom Modal Lightbox */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Top Control Bar */}
          <div
            className="w-full max-w-6xl flex items-center justify-between py-2 text-neutral-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400 truncate">
                {product.name}
              </span>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <span className="text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg shrink-0">
                Color: <strong className="text-amber-400 font-bold">{selectedColor}</strong> ({activeImageIndex + 1}/{activeGalleryImages.length})
              </span>
            </div>
            <button
              onClick={() => setIsZoomOpen(false)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
              title="Close Zoom (Esc)"
            >
              <span className="hidden sm:inline">Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Stage with Prev / Next Navigation */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-2 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Photo Button */}
            {activeGalleryImages.length > 1 && (
              <button
                onClick={() =>
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : activeGalleryImages.length - 1))
                }
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700 backdrop-blur-md transition-all hover:scale-110 shadow-2xl cursor-pointer"
                title="Previous Photo (← Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Main Zoomed High-Resolution Image */}
            <div className="relative max-h-[75vh] max-w-full flex items-center justify-center">
              <img
                src={currentDisplayImage.url}
                alt={currentDisplayImage.alt || `${product.name} Zoomed`}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-200"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Next Photo Button */}
            {activeGalleryImages.length > 1 && (
              <button
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev < activeGalleryImages.length - 1 ? prev + 1 : 0
                  )
                }
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700 backdrop-blur-md transition-all hover:scale-110 shadow-2xl cursor-pointer"
                title="Next Photo (→ Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip inside Zoom Modal */}
          <div
            className="w-full max-w-2xl flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-2 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {activeGalleryImages.map((img, idx) => (
              <button
                key={img.id || `zoom-thumb-${idx}`}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-neutral-900 cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105 opacity-100'
                    : 'border-neutral-800 opacity-60 hover:opacity-100'
                }`}
                title={`Photo ${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt={`thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
