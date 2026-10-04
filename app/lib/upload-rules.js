// Upload rules shared by the browser (fast feedback) and the server (the
// real check — see uploadToS3.js, which inspects the file bytes).

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB
export const MAX_JOB_PHOTOS = 5

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PDF_TYPES = ['application/pdf']

export const ACCEPT = {
  image: IMAGE_TYPES.join(','),
  imageOrPdf: [...IMAGE_TYPES, ...PDF_TYPES].join(','),
}

// Returns an error message, or null when the file looks acceptable.
export function checkFileClient(file, { allowPdf = false } = {}) {
  if (!file) return 'No file selected'
  const allowed = allowPdf ? [...IMAGE_TYPES, ...PDF_TYPES] : IMAGE_TYPES
  if (!allowed.includes(file.type)) {
    return allowPdf
      ? 'Only JPG, PNG, WebP or PDF files are allowed'
      : 'Only JPG, PNG or WebP images are allowed'
  }
  if (file.size > MAX_UPLOAD_BYTES) return 'File is too large (max 10 MB)'
  return null
}

// App URL for a private object; /api/files checks the viewer may see it.
export function privateFileUrl(key) {
  return key ? `/api/files?key=${encodeURIComponent(key)}` : null
}
