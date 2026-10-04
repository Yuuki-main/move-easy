import { randomUUID } from 'crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, BUCKET_NAME, getS3Url } from './s3'
import { MAX_UPLOAD_BYTES, privateFileUrl } from './upload-rules'

export class UploadError extends Error {}

// Identify a file from its first bytes. The browser-supplied MIME type is
// never trusted: a renamed .html must not be stored and served as anything.
function sniff(buffer) {
  const b = buffer
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg', kind: 'image' }
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png', kind: 'image' }
  }
  if (
    b.length >= 12 &&
    b.toString('ascii', 0, 4) === 'RIFF' &&
    b.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp', kind: 'image' }
  }
  if (b.length >= 5 && b.toString('ascii', 0, 5) === '%PDF-') {
    return { mime: 'application/pdf', ext: 'pdf', kind: 'pdf' }
  }
  return null
}

// Throws UploadError unless the bytes are an allowed file type within size.
export function inspectUpload(buffer, { allowPdf = false } = {}) {
  if (!buffer?.length) throw new UploadError('The file is empty')
  if (buffer.length > MAX_UPLOAD_BYTES) throw new UploadError('File is too large (max 10 MB)')

  const type = sniff(buffer)
  if (!type || (type.kind === 'pdf' && !allowPdf)) {
    throw new UploadError(
      allowPdf
        ? 'Only JPG, PNG, WebP or PDF files are allowed'
        : 'Only JPG, PNG or WebP images are allowed',
    )
  }
  return type
}

/**
 * Validate and upload a file.
 * - allowPdf: accept PDFs as well as images
 * - isPrivate: store under private/ (no public URL; served via /api/files)
 * Throws UploadError with a user-facing message when the file is rejected.
 */
export async function uploadToS3({ buffer, folder = 'uploads', allowPdf = false, isPrivate = false }) {
  const type = inspectUpload(buffer, { allowPdf })

  // Unguessable key; never derived from the user's file name.
  const key = `${isPrivate ? 'private/' : ''}${folder}/${randomUUID()}.${type.ext}`

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: type.mime,
      ContentDisposition: type.kind === 'pdf' ? 'inline' : undefined,
      CacheControl: isPrivate ? 'private, no-store' : 'max-age=31536000',
    }),
  )

  return {
    key,
    url: isPrivate ? privateFileUrl(key) : getS3Url(key),
    mime: type.mime,
  }
}

