import { storage } from "./firebase-admin";

const bucket = storage.bucket();

/**
 * Upload a buffer to Google Cloud Storage and return the public URL.
 */
export async function uploadToGcs(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000",
    },
  });

  // Make the file publicly readable
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
  return publicUrl;
}

/**
 * Download a file from Google Cloud Storage as a Buffer.
 */
export async function downloadFromGcs(path: string): Promise<Buffer> {
  const file = bucket.file(path);
  const [contents] = await file.download();
  return contents;
}

/**
 * Delete a file from Google Cloud Storage.
 */
export async function deleteFromGcs(path: string): Promise<void> {
  const file = bucket.file(path);
  await file.delete({ ignoreNotFound: true });
}

/**
 * Generate a signed URL for temporary access.
 */
export async function getSignedUrl(
  path: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const file = bucket.file(path);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}
