import 'dotenv/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

let currentDir = '';
if (typeof __dirname !== 'undefined') {
  currentDir = __dirname;
} else {
  currentDir = process.cwd();
}
const IS_VERCEL = !!process.env.VERCEL;
const UPLOAD_DIR = IS_VERCEL ? '/tmp/uploads' : path.join(currentDir, 'data', 'uploads');

// Support both standard and specific Cloudflare R2 environment variables
const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

export const isR2Configured = !!(
  bucketName &&
  accessKeyId &&
  secretAccessKey &&
  endpoint
);

let s3Client: S3Client | null = null;

if (isR2Configured) {
  try {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint!,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
    console.log('[Storage] Initialized Cloudflare R2 storage client with endpoint:', endpoint);
  } catch (err) {
    console.error('[Storage] Failed to initialize S3Client for R2:', err);
  }
} else {
  console.log('[Storage] Cloudflare R2 environment variables not complete. Falling back to local file storage.');
}

/**
 * Generates a presigned PUT URL for client-side direct uploads to R2 or local fallback
 */
export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 300
): Promise<string> {
  const cleanKey = key.startsWith('/') ? key.substring(1) : key;
  if (isR2Configured && s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName!,
        Key: cleanKey,
        ContentType: contentType,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      console.error('[Storage] Failed to generate presigned upload URL, using local fallback:', err);
    }
  }
  return `/api/local-storage-fallback-upload?key=${encodeURIComponent(cleanKey)}`;
}

/**
 * Generates a presigned GET URL for client-side downloads from R2 or local fallback
 */
export async function generateDownloadUrl(
  storagePath: string,
  expiresInSeconds: number = 3600,
  inline: boolean = true
): Promise<string> {
  if (storagePath.startsWith('r2://') && isR2Configured && s3Client) {
    try {
      const key = storagePath.replace('r2://', '');
      const command = new GetObjectCommand({
        Bucket: bucketName!,
        Key: key,
        ResponseContentDisposition: inline ? 'inline' : 'attachment',
      });
      return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      console.error('[Storage] Failed to generate presigned download URL, using local fallback:', err);
    }
  }

  // Local fallback path
  const key = storagePath.startsWith('local://')
    ? storagePath.replace('local://', '')
    : storagePath.replace(/\//g, '_');
  return `/api/local-storage-fallback-download?key=${encodeURIComponent(key)}`;
}

/**
 * Uploads a file (buffer) to the appropriate storage (R2 or local fallback)
 * @param key unique path/identifier for the file
 * @param buffer file content
 * @param contentType file mime type
 * @returns physical path/identifier or URL
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (isR2Configured && s3Client) {
    try {
      const activeBucket = bucketName!;
      const cleanKey = key.startsWith('/') ? key.substring(1) : key;
      
      await s3Client.send(
        new PutObjectCommand({
          Bucket: activeBucket,
          Key: cleanKey,
          Body: buffer,
          ContentType: contentType,
        })
      );
      
      console.log(`[Storage] Uploaded "${cleanKey}" to Cloudflare R2.`);
      return `r2://${cleanKey}`;
    } catch (err) {
      console.error('[Storage] R2 upload failed, saving to local fallback:', err);
    }
  }

  // Local fallback
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    
    // Sanitize key for directory path
    const safeKey = key.replace(/\//g, '_');
    const localFilePath = path.join(UPLOAD_DIR, safeKey);
    
    fs.writeFileSync(localFilePath, buffer);
    console.log(`[Storage] Saved file to local storage: "${localFilePath}"`);
    return `local://${safeKey}`;
  } catch (err) {
    console.error('[Storage] Local upload failed:', err);
    throw new Error('Failed to save file content to any available storage.');
  }
}

/**
 * Retrieves a file's content as a buffer
 * @param storagePath the storage uri returned from uploadFile
 */
export async function getFile(storagePath: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (storagePath.startsWith('r2://') && isR2Configured && s3Client) {
    try {
      const key = storagePath.replace('r2://', '');
      
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName!,
          Key: key,
        })
      );

      if (response.Body) {
        // Convert stream to Buffer
        const bytes = await response.Body.transformToByteArray();
        const buffer = Buffer.from(bytes);
        const contentType = response.ContentType || 'application/pdf';
        return { buffer, contentType };
      }
    } catch (err) {
      console.error(`[Storage] Failed to fetch file from R2 (${storagePath}):`, err);
    }
  }

  // Local file fallback
  try {
    const key = storagePath.startsWith('local://')
      ? storagePath.replace('local://', '')
      : storagePath.replace(/\//g, '_');
      
    const localFilePath = path.join(UPLOAD_DIR, key);
    if (fs.existsSync(localFilePath)) {
      const buffer = fs.readFileSync(localFilePath);
      return {
        buffer,
        contentType: 'application/pdf',
      };
    }
  } catch (err) {
    console.error('[Storage] Local file read failed:', err);
  }

  throw new Error(`File not found or storage is unavailable: ${storagePath}`);
}


/**
 * Deletes a file from storage
 */
export async function deleteFile(storagePath: string): Promise<boolean> {
  if (storagePath.startsWith('r2://') && isR2Configured && s3Client) {
    try {
      const key = storagePath.replace('r2://', '');
      
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName!,
          Key: key,
        })
      );
      console.log(`[Storage] Deleted file from R2: ${key}`);
      return true;
    } catch (err) {
      console.error(`[Storage] Failed to delete file from R2 (${storagePath}):`, err);
      return false;
    }
  }

  // Local file fallback
  try {
    const key = storagePath.startsWith('local://')
      ? storagePath.replace('local://', '')
      : storagePath.replace(/\//g, '_');
      
    const localFilePath = path.join(UPLOAD_DIR, key);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log(`[Storage] Deleted local file: ${localFilePath}`);
      return true;
    }
    return true; // Already doesn't exist
  } catch (err) {
    console.error('[Storage] Local file delete failed:', err);
    return false;
  }
}
