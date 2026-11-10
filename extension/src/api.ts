// API client for PixelForge backend
const BASE_URL = 'http://127.0.0.1:7832';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function convertImage(
  file: File,
  format: string,
  quality: number
): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('format', format);
  form.append('quality', String(quality));
  const res = await fetch(`${BASE_URL}/convert`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

export async function compressImage(
  file: File,
  quality: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('quality', String(quality));
  if (maxWidth) form.append('max_width', String(maxWidth));
  if (maxHeight) form.append('max_height', String(maxHeight));
  const res = await fetch(`${BASE_URL}/compress/image`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

export async function compressPDF(file: File, level: number): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('level', String(level));
  const res = await fetch(`${BASE_URL}/compress/pdf`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

export async function removeBackground(
  file: File,
  alphaMatting: boolean,
  postProcess: boolean
): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('alpha_matting', String(alphaMatting));
  form.append('post_process', String(postProcess));
  const res = await fetch(`${BASE_URL}/remove-background`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  // Use Chrome downloads API if running inside an extension with downloads permission
  if (typeof chrome !== 'undefined' && chrome.downloads && typeof chrome.downloads.download === 'function') {
    chrome.downloads.download(
      {
        url,
        filename,
        saveAs: false,
      },
      () => {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    );
    return;
  }

  // Fallback for browser preview / standalone mode
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 10000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
