import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, BUCKET_NAME, getS3Url } from './s3'

export async function uploadToS3({
  buffer,
  fileName,
  mimeType,
  folder = 'uploads',
}) {
  // Create unique key: folder/timestamp-filename
  const key = `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'max-age=31536000', // cache for 1 year
  })

  await s3Client.send(command)

  return {
    key,
    url: getS3Url(key),
  }
}
