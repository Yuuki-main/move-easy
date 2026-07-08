import { S3Client } from '@aws-sdk/client-s3'

const region = process.env.AWS_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

console.log('[DEBUG S3 INIT] AWS_REGION:', region)
console.log('[DEBUG S3 INIT] AWS_ACCESS_KEY_ID:', accessKeyId ? `${accessKeyId.slice(0, 8)}...` : 'MISSING')
console.log('[DEBUG S3 INIT] AWS_SECRET_ACCESS_KEY:', secretAccessKey ? 'EXISTS' : 'MISSING')

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

console.log('[DEBUG S3 INIT] S3 client created successfully')
console.log('[DEBUG S3 INIT] S3 region:', s3Client.config.region)

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME
console.log('[DEBUG S3 INIT] BUCKET_NAME:', BUCKET_NAME)

// Generate public URL for an S3 object
export function getS3Url(key) {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}
