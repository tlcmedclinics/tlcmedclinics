import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { verifyRequest } from "@/lib/auth-server";

// Cap uploads so a profile photo can't be used to push arbitrarily large files
// into the clinic's Cloudinary account.
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  // This route was open to anyone before — an unauthenticated endpoint that
  // writes to paid storage is an abuse vector regardless of what the UI does.
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That image is larger than 5MB" }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "tlc-med-clinics" },
      (err, res) => {
        if (err || !res) return reject(err);
        resolve(res as { secure_url: string });
      }
    );
    stream.end(buffer);
  });

  return NextResponse.json({ url: result.secure_url });
}
