import { NextResponse } from "next/server";
import sharp from "sharp";
import { verifyAdmin } from "@/lib/auth";
import { uploadToGcs } from "@/lib/gcs";

export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let gcsPath = formData.get("path") as string | null;

    if (!file || !gcsPath) {
      return NextResponse.json(
        { error: "Missing file or path" },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const isImage = file.type.startsWith("image/");

    let buffer: Buffer;
    let contentType: string;

    if (isImage) {
      // Convert to WebP with optimization
      buffer = await sharp(rawBuffer)
        .webp({ quality: 85 })
        .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
        .toBuffer();
      contentType = "image/webp";

      // Ensure path ends with .webp
      gcsPath = gcsPath.replace(/\.[^.]+$/, ".webp");
    } else {
      buffer = rawBuffer;
      contentType = file.type;
    }

    const url = await uploadToGcs(buffer, gcsPath, contentType);

    return NextResponse.json({ url, path: gcsPath });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
