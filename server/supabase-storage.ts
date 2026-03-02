import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const KYC_BUCKET = "kyc_documents";
export const PRODUCT_BUCKET = "product_images";

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non configuré. Ajoutez ces variables dans les secrets Replit."
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function uploadKycFile(
  filePath: string,
  mimetype: string,
  userId: number,
  fileType: "front" | "back" | "selfie"
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const ext = path.extname(filePath) || ".jpg";
  const objectPath = `user_${userId}/${Date.now()}_${fileType}${ext}`;
  const fileBuffer = fs.readFileSync(filePath);

  const { error } = await supabase.storage
    .from(KYC_BUCKET)
    .upload(objectPath, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  try { fs.unlinkSync(filePath); } catch {}

  if (error) {
    throw new Error(`Échec upload KYC (${fileType}): ${error.message}`);
  }

  console.log(`[supabase-storage] KYC ${fileType} uploaded: ${objectPath}`);
  return objectPath;
}

export async function uploadProductImage(
  filePath: string,
  mimetype: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const ext = path.extname(filePath) || ".jpg";
  const objectPath = `products/${randomUUID()}${ext}`;
  const fileBuffer = fs.readFileSync(filePath);

  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(objectPath, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  try { fs.unlinkSync(filePath); } catch {}

  if (error) {
    throw new Error(`Échec upload image produit: ${error.message}`);
  }

  console.log(`[supabase-storage] Product image uploaded: ${objectPath}`);
  const { data: urlData } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(objectPath);
  return urlData.publicUrl;
}

export async function getKycSignedUrl(objectPath: string, expiresInSeconds = 3600): Promise<string> {
  if (!objectPath) return "";
  if (objectPath.startsWith("http") || objectPath.startsWith("/uploads")) {
    return objectPath;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(KYC_BUCKET)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("[supabase-storage] Signed URL error:", error?.message);
    return "";
  }
  return data.signedUrl;
}

export function isSupabaseStorageConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}
