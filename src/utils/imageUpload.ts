/**
 * High-performance client-side image compression and upload utility
 * Prevents localStorage quota exceeded errors and ensures fast UI responsiveness.
 */

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return reject(new Error('Empty image file.'));

      // If SVG, return directly as it is vector and small
      if (file.type === 'image/svg+xml') {
        return resolve(src);
      }

      const img = new Image();
      img.onerror = () => resolve(src); // fallback to raw
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(src);
        }

        // Draw and compress
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image client-side and uploads it to the backend /api/upload endpoint.
 * Returns the permanent /api/uploads/... url or fallback compressed data URL.
 */
export async function compressAndUploadImage(file: File): Promise<string> {
  try {
    const compressed = await compressImage(file, 1200, 1200, 0.82);

    // Attempt upload to backend
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: compressed,
          name: file.name,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          return json.url;
        }
      }
    } catch (uploadErr) {
      console.warn('Backend upload skipped, using compressed image data url:', uploadErr);
    }

    return compressed;
  } catch (err) {
    console.error('Image compression error:', err);
    throw err;
  }
}
