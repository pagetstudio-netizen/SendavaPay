import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { getCredential } from "./credentials";

export const KYC_BUCKET = "kyc_documents";
export const PRODUCT_BUCKET = "product_images";

function getSupabaseAdmin() {
  const url = getCredential("SUPABASE_URL");
  const key = getCredential("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non configuré. Ajoutez ces valeurs dans la section Clés API du panneau admin."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function uploadKycFile(
  fileBuffer: Buffer,
  mimetype: string,
  userId: number,
  fileType: "front" | "back" | "selfie"
): Promise<string> {
  const ext = mimetype.includes("png") ? ".png" : mimetype.includes("gif") ? ".gif" : ".jpg";
  const objectPath = `user_${userId}/${Date.now()}_${fileType}${ext}`;

  console.log(`[kyc-upload] Tentative upload ${fileType} vers Supabase Storage: ${objectPath} (${fileBuffer.length} octets)`);

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = getSupabaseAdmin();
  } catch (configErr: any) {
    console.error(`[kyc-upload] Configuration Supabase manquante: ${configErr.message}`);
    throw new Error(`Stockage non configuré. Contactez l'administrateur. (${configErr.message})`);
  }

  const { error } = await supabase.storage
    .from(KYC_BUCKET)
    .upload(objectPath, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    console.error(`[kyc-upload] Échec upload ${fileType}: ${error.message}`, { objectPath, mimetype, userId });
    throw new Error(`Échec de l'enregistrement du document (${fileType}). Réessayez ou contactez le support.`);
  }

  console.log(`[kyc-upload] OK — ${fileType} enregistré: ${objectPath}`);
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
