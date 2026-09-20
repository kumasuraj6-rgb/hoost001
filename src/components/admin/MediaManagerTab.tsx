import React, { useState } from 'react';
import {
  Image,
  Upload,
  Trash2,
  Copy,
  Check,
  Search,
  Eye,
  Plus,
  Clipboard,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MediaItem } from '../../types';
import { compressAndUploadImage } from '../../utils/imageUpload';
import { copyTextToClipboard, formatMediaUrlForSharing } from '../../utils/clipboard';

export const MediaManagerTab: React.FC = () => {
  const { mediaList, addMedia, deleteMedia, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<MediaItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);

  // Upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<'PRODUCT' | 'BANNER' | 'LOGO' | 'OTHER'>('PRODUCT');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');

  const filteredMedia = mediaList.filter((m) => {
    const itemCat = m.category || 'PRODUCT';
    if (selectedCategory !== 'ALL' && itemCat !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const title = (m.title || m.name || '').toLowerCase();
      const cat = itemCat.toLowerCase();
      return title.includes(q) || cat.includes(q);
    }
    return true;
  });

  const handleCopyUrl = async (item: MediaItem) => {
    const validUrl = formatMediaUrlForSharing(item.url);
    await copyTextToClipboard(validUrl);
    setCopiedId(item.id);
    showToast('URL Copied to clipboard!', 'success');
    setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 2500);
  };

  const handlePasteFromClipboard = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUploadUrl(text.trim());
          showToast('URL pasted from clipboard!', 'info');
          return;
        }
      } catch (err) {
        console.warn('Clipboard read error (iframe restriction):', err);
      }
    }
    const inputEl = document.getElementById('manual-media-url-input') as HTMLInputElement | null;
    inputEl?.focus();
    showToast('Click input and press Ctrl+V / Cmd+V to paste', 'info');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showToast('Uploading media items...', 'info');
    for (const file of Array.from(files) as File[]) {
      try {
        const uploadedUrl = await compressAndUploadImage(file);
        const displayName = file.name.replace(/\.[^/.]+$/, '');
        await addMedia({
          name: displayName,
          title: displayName,
          url: uploadedUrl,
          category: uploadCategory,
          size: `${Math.round(file.size / 1024)} KB`,
        });
      } catch (err: any) {
        console.error('Failed to upload file:', err);
      }
    }
    showToast('Media items uploaded successfully', 'success');
  };

  const handleManualAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = uploadUrl.trim();
    if (!cleanUrl) {
      showToast('Please enter an image URL', 'error');
      return;
    }
    const displayName = uploadTitle.trim() || 'Uploaded Media Asset';
    await addMedia({
      name: displayName,
      title: displayName,
      url: cleanUrl,
      category: uploadCategory,
      size: 'Remote CDN',
    });
    setUploadUrl('');
    setUploadTitle('');
    setIsUploading(false);
    showToast('Asset added to gallery successfully', 'success');
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id;
    const targetName = itemToDelete.title || itemToDelete.name || 'Media asset';

    // Close modal first
    setItemToDelete(null);

    // If currently previewed, close preview modal too
    if (previewImage?.id === targetId) {
      setPreviewImage(null);
    }

    // Permanently remove from state/storage
    await deleteMedia(targetId);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" />
            <span>Digital Asset Library</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Media & Gallery Manager
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Upload, organize, inspect, and copy permanent URLs for product photographs, high-resolution hero
            banners, brand emblems, and riding gear catalogs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20">
            <Upload className="w-4 h-4" />
            <span>Upload From Device</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsUploading(!isUploading)}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add by URL</span>
          </button>
        </div>
      </div>

      {/* Add by URL panel if open */}
      {isUploading && (
        <form
          onSubmit={handleManualAddUrl}
          className="p-5 rounded-2xl bg-neutral-900 border border-amber-500/30 space-y-4 text-xs"
        >
          <div className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Register Remote Image Asset</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-neutral-400 font-semibold mb-1 block">Title / Name</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Cordura Jacket Front View"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-neutral-400 font-semibold mb-1 block">Asset Type</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="PRODUCT">PRODUCT</option>
                <option value="BANNER">BANNER</option>
                <option value="LOGO">LOGO</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="text-neutral-400 font-semibold mb-1 block">Direct Image URL *</label>
              <div className="flex gap-1.5">
                <input
                  id="manual-media-url-input"
                  type="text"
                  required
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /api/..."
                  className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono text-xs focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                  title="Paste copied URL from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Paste</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploading(false)}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 text-black font-bold uppercase tracking-wider"
            >
              Save Asset
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media by title or type..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'PRODUCT', 'BANNER', 'LOGO', 'OTHER'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Media Assets */}
      {filteredMedia.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-3">
          <Image className="w-12 h-12 text-neutral-600 mx-auto" />
          <div className="text-sm font-bold text-neutral-300">No media assets found</div>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Upload riding gear photos or banners from your computer, or paste URLs to start populating your
            gallery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => {
            const displayName = item.title || item.name || 'Media Asset';
            const displayCategory = item.category || 'PRODUCT';
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col justify-between group shadow-sm hover:border-neutral-700 transition-colors"
              >
                {/* Thumbnail */}
                <div
                  className="relative h-36 bg-neutral-950 cursor-pointer overflow-hidden"
                  onClick={() => setPreviewImage(item)}
                >
                  <img
                    src={item.url}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-amber-400 text-[9px] font-black uppercase tracking-wider">
                    {displayCategory}
                  </span>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white drop-shadow" />
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-3 space-y-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-neutral-200 truncate" title={displayName}>
                      {displayName}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      {item.size || 'Web format'} • {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                    <button
                      id={`copy-url-btn-${item.id}`}
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      }`}
                      title="Copy permanent URL to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-amber-400" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <button
                      id={`delete-media-btn-${item.id}`}
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-100">
                  {previewImage.title || previewImage.name}
                </h3>
                <span className="text-[10px] font-mono text-amber-400 uppercase">
                  {previewImage.category || 'PRODUCT'} • {previewImage.size}
                </span>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto flex items-center justify-center p-4 bg-neutral-950">
              <img
                src={previewImage.url}
                alt={previewImage.title || previewImage.name}
                className="max-h-full max-w-full rounded-xl object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="font-mono text-neutral-400 truncate max-w-md text-[11px]">
                {formatMediaUrlForSharing(previewImage.url)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(previewImage)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-red-950 hover:text-red-400 text-neutral-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  id="preview-copy-url-btn"
                  type="button"
                  onClick={() => handleCopyUrl(previewImage)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-all ${
                    copiedId === previewImage.id
                      ? 'bg-emerald-500 text-black'
                      : 'bg-amber-500 hover:bg-amber-400 text-black'
                  }`}
                >
                  {copiedId === previewImage.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Image URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Reliable inside sandboxed iframes) */}
      {itemToDelete && (
        <div
          id="delete-media-confirm-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setItemToDelete(null)}
        >
          <div
            className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-neutral-100 uppercase tracking-tight">
                Delete Media Asset?
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-neutral-200">
                  "{itemToDelete.title || itemToDelete.name || 'this asset'}"
                </span>
                ? It will be removed from your digital library immediately.
              </p>
            </div>

            {/* Asset preview card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <img
                src={itemToDelete.url}
                alt={itemToDelete.title || itemToDelete.name}
                className="w-12 h-12 rounded-lg object-cover bg-neutral-900 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-neutral-200 truncate">
                  {itemToDelete.title || itemToDelete.name}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  {itemToDelete.category || 'PRODUCT'} • {itemToDelete.size || 'Web format'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                id="cancel-delete-media-btn"
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-media-btn"
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

