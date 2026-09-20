/**
 * Robust clipboard utility for sandboxed iframe environments and modern browsers.
 */

export function formatMediaUrlForSharing(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // If URL is root-relative (e.g. /api/uploads/photo.jpg), convert to absolute URL
  if (trimmed.startsWith('/') && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${trimmed}`;
  }

  return trimmed;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const cleanText = (text || '').trim();
  if (!cleanText) return false;

  // 1. Try modern navigator.clipboard API first
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(cleanText);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard.writeText blocked or failed, using textarea fallback:', err);
    }
  }

  // 2. Reliable textarea fallback for sandboxed iframes without clipboard permissions
  try {
    if (typeof document === 'undefined') return false;

    const textArea = document.createElement('textarea');
    textArea.value = cleanText;

    // Prevent scrolling and keep offscreen but selectable in DOM
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.01';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, cleanText.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (err) {
    console.error('[Clipboard] Textarea fallback copy error:', err);
    return false;
  }
}
