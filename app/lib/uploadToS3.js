import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, BUCKET_NAME, getS3Url } from './s3'

export async function uploadToS3({
  buffer,
  fileName,
  mimeType,
  folder = 'uploads',
}) {
  console.log('[DEBUG S3] uploadToS3() called')
  console.log('[DEBUG S3] fileName:', fileName)
  console.log('[DEBUG S3] folder:', folder)
  console.log('[DEBUG S3] mimeType:', mimeType)
  console.log('[DEBUG S3] buffer length:', buffer?.length ?? 'MISSING')
  console.log('[DEBUG S3] bucket name:', BUCKET_NAME)
  console.log('[DEBUG S3] AWS region:', process.env.AWS_REGION)

  // Create unique key: folder/timestamp-filename
  const key = `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  console.log('[DEBUG S3] Generated key:', key)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'max-age=31536000', // cache for 1 year
  })

  console.log('[DEBUG S3] Sending PutObjectCommand...')
  try {
    await s3Client.send(command)
    console.log('[DEBUG S3] PutObjectCommand succeeded')
  } catch (s3Error) {
    console.error('[DEBUG S3] PutObjectCommand FAILED:', s3Error)
    console.error('[DEBUG S3] Error name:', s3Error.name)
    console.error('[DEBUG S3] Error message:', s3Error.message)
    console.error('[DEBUG S3] Error code:', s3Error.Code)
    console.error('[DEBUG S3] Request ID:', s3Error.$metadata?.requestId)
    throw s3Error
  }

  const url = getS3Url(key)
  console.log('[DEBUG S3] Generated URL:', url)

  return { key, url }
}
