import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

export async function uploadBufferToS3(params: {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | Blob | string | Readable;
  contentType?: string;
}): Promise<string> {
  const { bucket, key, body, contentType } = params;
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  const publicUrlBase = process.env.S3_PUBLIC_URL_BASE; 
  if (publicUrlBase) return `${publicUrlBase.replace(/\/$/, '')}/${key}`;
  return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
}


