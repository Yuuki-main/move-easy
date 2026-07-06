import { S3Client } from '@aws-sdk/client-s3'

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME

// Generate public URL for an S3 object
export function getS3Url(key) {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}
