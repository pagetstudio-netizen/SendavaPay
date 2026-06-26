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
  return !!(getCredential("SUPABASE_URL") && getCredential("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function countKycStorageFiles(): Promise<{ count: number; sizeKb: number }> {
  const supabase = getSupabaseAdmin();
  let count = 0;
  let sizeKb = 0;
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: files, error } = await supabase.storage
      .from(KYC_BUCKET)
      .list("", { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });

    if (error || !files || files.length === 0) break;

    for (const file of files) {
      if (file.id) {
        count++;
        sizeKb += Math.round((file.metadata?.size || 0) / 1024);
      } else {
        const { data: subFiles } = await supabase.storage
          .from(KYC_BUCKET)
          .list(file.name, { limit: pageSize });
        for (const sf of subFiles || []) {
          count++;
          sizeKb += Math.round((sf.metadata?.size || 0) / 1024);
        }
      }
    }

    if (files.length < pageSize) break;
    offset += pageSize;
  }

  return { count, sizeKb };
}

export async function cleanupKycStorage(): Promise<{ deleted: number; errors: string[] }> {
  const supabase = getSupabaseAdmin();
  let deleted = 0;
  const errors: string[] = [];

  // List all files in the kyc_documents bucket (paginated by 1000)
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: files, error: listError } = await supabase.storage
      .from(KYC_BUCKET)
      .list("", { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });

    if (listError) {
      errors.push(`Erreur listage: ${listError.message}`);
      break;
    }
    if (!files || files.length === 0) break;

    // Collect all file paths including subfolders
    const paths: string[] = [];
    for (const file of files) {
      if (file.id) {
        // It's a file
        paths.push(file.name);
      } else {
        // It's a folder — list its contents
        const { data: subFiles, error: subErr } = await supabase.storage
          .from(KYC_BUCKET)
          .list(file.name, { limit: pageSize });
        if (subErr) {
          errors.push(`Erreur listage dossier ${file.name}: ${subErr.message}`);
          continue;
        }
        for (const sf of subFiles || []) {
          paths.push(`${file.name}/${sf.name}`);
        }
      }
    }

    if (paths.length > 0) {
      const { error: delError } = await supabase.storage
        .from(KYC_BUCKET)
        .remove(paths);
      if (delError) {
        errors.push(`Erreur suppression: ${delError.message}`);
      } else {
        deleted += paths.length;
      }
    }

    if (files.length < pageSize) break;
    offset += pageSize;
  }

  return { deleted, errors };
}
