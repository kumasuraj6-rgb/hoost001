import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Image,
  Shield,
  Star,
  Check,
  AlertCircle,
  Layers,
  Sparkles,
  Clipboard,
} from 'lucide-react';
import {
  Product,
  ProductColorVariant,
  ProductImage,
  ALLOWED_CATEGORIES,
  AllowedCategory,
  validateProductSafety,
} from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { compressAndUploadImage } from '../../utils/imageUpload';
import { formatMediaUrlForSharing } from '../../utils/clipboard';

interface ProductEditorModalProps {
  product: Product | null; // null means creating new product
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  product,
  onClose,
  onSave,
}) => {
  const { storeSettings, showToast } = useStore();

  // Form State
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || `RDX-${Date.now().toString().slice(-5)}`);
  const [category, setCategory] = useState<AllowedCategory>(
    (product?.category as AllowedCategory) || 'Riding Jackets'
  );
  const [subcategory, setSubcategory] = useState(product?.subcategory || 'Touring');
  const [brand, setBrand] = useState(product?.brand || storeSettings.brandName);
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price || 4999);
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice || 6499);
  const [stock, setStock] = useState(product?.stock || 25);
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold || 5);
  const [armorLevel, setArmorLevel] = useState<Product['armorLevel']>(product?.armorLevel || 'CE Level 2');
  const [waterproofRating, setWaterproofRating] = useState(product?.waterproofRating || '10,000mm');
  const [material, setMaterial] = useState(product?.material || 'Cordura 600D with Knox Armor');
  const [status, setStatus] = useState<Product['status']>(product?.status || 'ACTIVE');

  // Sizes array
  const [sizes, setSizes] = useState<string[]>(product?.sizes || ['S', 'M', 'L', 'XL', '2XL']);
  const [newSizeInput, setNewSizeInput] = useState('');

  // Master Images (general)
  const [masterImages, setMasterImages] = useState<ProductImage[]>(
    product?.masterImages || [
      {
        id: 'm-1',
        url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        alt: 'Master Photo',
      },
    ]
  );
  const [masterUrlInput, setMasterUrlInput] = useState('');

  // Color Variants with independent galleries
  const [colorVariants, setColorVariants] = useState<ProductColorVariant[]>(
    product?.colorVariants && product.colorVariants.length > 0
      ? product.colorVariants
      : [
          {
            id: 'cv-1',
            colorName: 'Stealth Black',
            colorHex: '#18181b',
            images: [
              {
                id: 'cvi-1',
                url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
                alt: 'Stealth Black Front',
              },
            ],
          },
        ]
  );

  // New color variant input
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#27272a');

  // Active color gallery currently being edited
  const [activeColorEditIdx, setActiveColorEditIdx] = useState<number>(0);
  const [colorImageUrlInput, setColorImageUrlInput] = useState('');

  // Features
  const [features, setFeatures] = useState<string[]>(
    product?.features || ['Knox CE Level 2 armor at elbows & shoulders', 'Detachable thermal & rain liner']
  );
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Validation state
  const [safetyError, setSafetyError] = useState<string | null>(null);

  // Auto calculate discount percentage
  const discountPercentage = Math.max(
    0,
    Math.round(((originalPrice - price) / (originalPrice || 1)) * 100)
  );

  // Handle Master Image Upload
  const handleMasterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processing and uploading image...', 'info');
      const uploadedUrl = await compressAndUploadImage(file);
      setMasterImages((prev) => [
        ...prev,
        { id: `img-${Date.now()}`, url: uploadedUrl, alt: `${name} photo` },
      ]);
      showToast('Photo added to master gallery', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    }
  };

  const handleAddMasterUrl = () => {
    if (!masterUrlInput.trim()) return;
    setMasterImages((prev) => [
      ...prev,
      { id: `img-${Date.now()}`, url: masterUrlInput.trim(), alt: `${name} photo` },
    ]);
    setMasterUrlInput('');
  };

  // Add Color Variant
  const handleAddColorVariant = () => {
    if (!newColorName.trim()) return;
    const newVariant: ProductColorVariant = {
      id: `cv-${Date.now()}`,
      colorName: newColorName.trim(),
      colorHex: newColorHex,
      images: [],
    };
    setColorVariants((prev) => [...prev, newVariant]);
    setActiveColorEditIdx(colorVariants.length);
    setNewColorName('');
    showToast(`Added color variant: ${newVariant.colorName}`, 'info');
  };

  // Delete Color Variant
  const handleDeleteColorVariant = (idx: number) => {
    if (colorVariants.length <= 1) {
      alert('A product must have at least one color variant.');
      return;
    }
    setColorVariants((prev) => prev.filter((_, i) => i !== idx));
    setActiveColorEditIdx(0);
  };

  // Handle Color Specific Image Upload
  const handleColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processing and uploading image...', 'info');
      const uploadedUrl = await compressAndUploadImage(file);
      setColorVariants((prev) => {
        const updated = [...prev];
        const active = updated[activeColorEditIdx];
        if (active) {
          active.images = [
            ...active.images,
            { id: `cimg-${Date.now()}`, url: uploadedUrl, alt: `${active.colorName} photo` },
          ];
        }
        return updated;
      });
      showToast('Photo added to color variant gallery', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload color photo', 'error');
    }
  };

  const handlePasteColorImageUrl = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setColorImageUrlInput(text.trim());
          showToast('Image URL pasted!', 'info');
          return;
        }
      } catch (err) {
        console.warn('Clipboard paste exception:', err);
      }
    }
    const inputEl = document.getElementById('product-color-image-url-input') as HTMLInputElement | null;
    inputEl?.focus();
    showToast('Press Ctrl+V / Cmd+V to paste', 'info');
  };

  const handleAddColorImageUrl = () => {
    const raw = colorImageUrlInput.trim();
    if (!raw) return;
    const formattedUrl = formatMediaUrlForSharing(raw);
    setColorVariants((prev) => {
      const updated = [...prev];
      const active = updated[activeColorEditIdx];
      if (active) {
        active.images = [
          ...active.images,
          { id: `cimg-${Date.now()}`, url: formattedUrl, alt: `${active.colorName} photo` },
        ];
      }
      return updated;
    });
    setColorImageUrlInput('');
    showToast('Photo added from URL', 'success');
  };

  const handleDeleteColorImage = (colorIdx: number, imgIdx: number) => {
    setColorVariants((prev) => {
      const updated = [...prev];
      const active = updated[colorIdx];
      if (active) {
        active.images = active.images.filter((_, i) => i !== imgIdx);
      }
      return updated;
    });
  };

  // Add / Remove Sizes
  const handleAddSize = () => {
    if (!newSizeInput.trim() || sizes.includes(newSizeInput.trim().toUpperCase())) return;
    setSizes((prev) => [...prev, newSizeInput.trim().toUpperCase()]);
    setNewSizeInput('');
  };

  const handleRemoveSize = (sz: string) => {
    setSizes((prev) => prev.filter((s) => s !== sz));
  };

  // Add / Remove Features
  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFeatures((prev) => [...prev, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSafetyError(null);

    // Enforce strict product safety rule
    const safety = validateProductSafety(name, category);
    if (!safety.valid) {
      setSafetyError(safety.reason || 'Product violates riding gear catalog restrictions.');
      showToast(safety.reason || 'Violation of catalog restrictions', 'error');
      return;
    }

    const payload: Partial<Product> = {
      ...(product ? { id: product.id } : {}),
      name,
      sku,
      category,
      subcategory,
      brand: brand || storeSettings.brandName,
      description,
      price: Number(price),
      originalPrice: Number(originalPrice),
      discountPercentage,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      sizes,
      colors: colorVariants.map((c) => c.colorName),
      colorVariants,
      masterImages,
      armorLevel,
      waterproofRating,
      material,
      features,
      status,
      rating: product?.rating || 5.0,
      reviewCount: product?.reviewCount || 1,
    };

    onSave(payload);
  };

  const activeColor = colorVariants[activeColorEditIdx] || colorVariants[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
              {product ? 'Edit Gear Specification' : 'Add New Riding Equipment'}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-100 mt-0.5">
              {name || 'Untitled Gear Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {safetyError && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-red-300 font-bold">Catalog Compliance Violation</strong>
                <span>{safetyError}</span>
              </div>
            </div>
          )}

          {/* Section 1: Basic Identifiers */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Core Equipment Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-neutral-400 font-medium">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-semibold focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Explorer Cordura All-Weather Riding Jacket"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">SKU (Inventory Code) *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Strict Allowed Categories Only */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Authorized Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AllowedCategory)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                >
                  {ALLOWED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-emerald-400">Strictly riding gear only</span>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Subcategory / Style</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. All-Season Touring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder={storeSettings.brandName}
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-neutral-400 font-medium">Product Description *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                placeholder="Detailed description of technical riding qualities, thermal and rain liners, and ventilation..."
              />
            </div>
          </div>

          {/* Section 2: Pricing in INR & Stock */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Pricing in INR & Inventory
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Selling Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">MRP / Original (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Calculated Discount</label>
                <input
                  type="text"
                  disabled
                  value={`${discountPercentage}% OFF`}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-400 font-mono font-bold cursor-not-allowed opacity-80"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Stock Units *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Low Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Armor, Waterproofing & Construction Specs */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Protection & Technical Specs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Armor Rating</label>
                <select
                  value={armorLevel}
                  onChange={(e) => setArmorLevel(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="CE Level 2">CE Level 2 (Knox / D3O)</option>
                  <option value="CE Level 1">CE Level 1</option>
                  <option value="None">None (Rain / Luggage)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Waterproof Rating</label>
                <input
                  type="text"
                  value={waterproofRating}
                  onChange={(e) => setWaterproofRating(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. 15,000mm Reissa"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Primary Material</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Cordura 600D / Full-grain goat leather"
                />
              </div>
            </div>

            {/* Available Sizes */}
            <div className="space-y-2 pt-2 border-t border-neutral-900">
              <label className="text-neutral-400 font-medium">Available Sizes</label>
              <div className="flex flex-wrap items-center gap-2">
                {sizes.map((sz) => (
                  <span
                    key={sz}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 font-bold"
                  >
                    <span>{sz}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(sz)}
                      className="text-neutral-500 hover:text-red-400 text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    placeholder="Size (e.g. 3XL)"
                    className="w-24 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-neutral-100 uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: COLOR-WISE IMAGE GALLERIES (CRITICAL REQUIREMENT) */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <Image className="w-3.5 h-3.5" />
                  <span>Color-Wise Image Galleries (Mandatory Separation)</span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Each color variant holds its own independent photos (Front, Back, Side). Never mix images
                  between colors.
                </p>
              </div>

              {/* Add New Color Variant */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="New Color (e.g. Desert Sand)"
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-neutral-100"
                />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-8 h-8 rounded bg-transparent cursor-pointer"
                  title="Color swatch"
                />
                <button
                  type="button"
                  onClick={handleAddColorVariant}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold uppercase text-[11px]"
                >
                  Add Color
                </button>
              </div>
            </div>

            {/* Color Variant Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-900">
              {colorVariants.map((variant, idx) => (
                <div
                  key={variant.id || idx}
                  onClick={() => setActiveColorEditIdx(idx)}
                  className={`cursor-pointer px-3 py-2 rounded-xl border flex items-center gap-2 transition-all shrink-0 ${
                    activeColorEditIdx === idx
                      ? 'bg-neutral-850 border-amber-500 text-amber-400 shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-700"
                    style={{ backgroundColor: variant.colorHex || '#333' }}
                  />
                  <span className="font-bold">{variant.colorName}</span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    ({variant.images.length} photos)
                  </span>
                  {colorVariants.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteColorVariant(idx);
                      }}
                      className="text-neutral-500 hover:text-red-400 ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Photos inside Active Color Variant */}
            {activeColor && (
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-neutral-200">
                    Photos for <span className="text-amber-400">{activeColor.colorName}</span>:
                  </div>

                  {/* Add photo controls */}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold flex items-center gap-1.5 border border-neutral-700">
                      <Upload className="w-3 h-3 text-amber-500" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleColorImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Add by image URL */}
                <div className="flex items-center gap-2">
                  <input
                    id="product-color-image-url-input"
                    type="text"
                    value={colorImageUrlInput}
                    onChange={(e) => setColorImageUrlInput(e.target.value)}
                    placeholder={`Paste image URL for ${activeColor.colorName}...`}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePasteColorImageUrl}
                    className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-lg flex items-center gap-1 text-xs transition-colors"
                    title="Paste copied URL from clipboard"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Paste</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddColorImageUrl}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                  >
                    Add URL
                  </button>
                </div>

                {/* Thumbnails grid for this color */}
                {activeColor.images.length === 0 ? (
                  <div className="p-6 text-center text-neutral-500 bg-neutral-950 rounded-lg border border-dashed border-neutral-800">
                    No photos added for {activeColor.colorName} yet. Upload front, back, and side views.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                    {activeColor.images.map((img, iIdx) => (
                      <div
                        key={img.id || iIdx}
                        className="relative rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 group h-28"
                      >
                        <img
                          src={img.url}
                          alt={img.alt || activeColor.colorName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {iIdx === 0 && (
                          <span className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded">
                            PRIMARY
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteColorImage(activeColorEditIdx, iIdx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-red-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Features Bullet Points */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Key Features Bullet Points
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                placeholder="e.g. Knox Micro-Lock CE Level 2 Back Protector included"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl"
              >
                Add Feature
              </button>
            </div>
            <div className="space-y-1.5">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-neutral-850 text-neutral-300"
                >
                  <span className="truncate pr-2">• {feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            Status:{' '}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-200 font-bold ml-1"
            >
              <option value="ACTIVE">ACTIVE (Live in Store)</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20"
              id="submit-product-form-btn"
            >
              {product ? 'Save & Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
