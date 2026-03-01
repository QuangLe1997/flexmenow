import { getStorageInstance } from "../config/firebase";
import { STORAGE_BUCKET } from "../config/constants";
import { logger } from "../utils/logger";
import { throwInternal } from "../utils/errors";

const LOG_CTX = { functionName: "storage_service" };

/**
 * Download a file from Firebase Storage and return it as a Buffer.
 *
 * @param storagePath - Path within the storage bucket (e.g. "uploads/abc/photo.jpg")
 */
export async function downloadImage(storagePath: string): Promise<Buffer> {
  try {
    const bucket = getStorageInstance().bucket(STORAGE_BUCKET);
    const file = bucket.file(storagePath);

    const [exists] = await file.exists();
    if (!exists) {
      throwInternal(`File not found in storage: ${storagePath}`);
    }

    const [buffer] = await file.download();
    logger.debug(`Downloaded ${storagePath} (${buffer.length} bytes)`, LOG_CTX);
    return buffer;
  } catch (error) {
    if (error instanceof Error && error.message.includes("File not found")) {
      throw error;
    }
    logger.error(`Failed to download ${storagePath}`, error, LOG_CTX);
    throwInternal(`Failed to download file: ${storagePath}`);
  }
}

/**
 * Upload a Buffer to Firebase Storage and return the public URL.
 *
 * @param buffer - Image data
 * @param destinationPath - Target path in the bucket (e.g. "generations/abc/output.png")
 * @param contentType - MIME type (defaults to "image/png")
 * @returns The public download URL
 */
export async function uploadImage(
  buffer: Buffer,
  destinationPath: string,
  contentType = "image/png"
): Promise<string> {
  try {
    const bucket = getStorageInstance().bucket(STORAGE_BUCKET);
    const file = bucket.file(destinationPath);

    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      },
      resumable: false,
    });

    // Make the file publicly readable
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${destinationPath}`;
    logger.debug(`Uploaded to ${destinationPath} (${buffer.length} bytes)`, LOG_CTX);
    return publicUrl;
  } catch (error) {
    logger.error(`Failed to upload to ${destinationPath}`, error, LOG_CTX);
    throwInternal(`Failed to upload file: ${destinationPath}`);
  }
}

/**
 * Get a time-limited signed URL for a storage object.
 *
 * @param storagePath - Path within the storage bucket
 * @param expiresInMinutes - URL lifetime in minutes (default 60)
 * @returns A signed URL string
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInMinutes = 60
): Promise<string> {
  try {
    const bucket = getStorageInstance().bucket(STORAGE_BUCKET);
    const file = bucket.file(storagePath);

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return url;
  } catch (error) {
    logger.error(`Failed to get signed URL for ${storagePath}`, error, LOG_CTX);
    throwInternal(`Failed to generate signed URL: ${storagePath}`);
  }
}

/**
 * Convert a storage buffer to a base64 string for API calls.
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}
