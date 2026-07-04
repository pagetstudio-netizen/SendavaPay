import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { getCredential } from "./credentials";
import sharp from "sharp";
import { db as dbInstance } from "./db";
import { kycRequests } from "@shared/schema";
import { eq, inArray, sql } from "drizzle-orm";

export const KYC_BUCKET = "kyc_documents";
export const PRODUCT_BUCKET = "product_images";

function getDbSafe() {
  if (!dbInstance) {
    throw new Error("Base de données indisponible");
  }
  return dbInstance;
}

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

async function compressKycImage(buffer: Buffer, mimetype: string): Promise<{ buffer: Buffer; mimetype: string }> {
  try {
    const originalKb = Math.round(buffer.length / 1024);

    const compressed = await sharp(buffer)
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, progressive: true })
      .toBuffer();

    const compressedKb = Math.round(compressed.length / 1024);
    console.log(`[kyc-compress] ${originalKb} Ko → ${compressedKb} Ko (réduction ${Math.round((1 - compressed.length / buffer.length) * 100)}%)`);

    return { buffer: compressed, mimetype: "image/jpeg" };
  } catch (err) {
    console.warn(`[kyc-compress] Compression échouée, envoi original: ${(err as Error).message}`);
    return { buffer, mimetype };
  }
}

export async function uploadKycFile(
  fileBuffer: Buffer,
  mimetype: string,
  userId: number,
  fileType: "front" | "back" | "selfie"
): Promise<string> {
  const originalKb = Math.round(fileBuffer.length / 1024);
  console.log(`[kyc-upload] ${fileType} reçu: ${originalKb} Ko (${mimetype})`);

  let compressed = { buffer: fileBuffer, mimetype };
  if (mimetype.startsWith("image/") && !mimetype.includes("gif")) {
    compressed = await compressKycImage(fileBuffer, mimetype);
  }

  const objectPath = `user_${userId}/${Date.now()}_${fileType}.jpg`;

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = getSupabaseAdmin();
  } catch (configErr: any) {
    console.error(`[kyc-upload] Configuration Supabase manquante: ${configErr.message}`);
    throw new Error(`Stockage non configuré. Contactez l'administrateur. (${configErr.message})`);
  }

  const { error } = await supabase.storage
    .from(KYC_BUCKET)
    .upload(objectPath, compressed.buffer, {
      contentType: compressed.mimetype,
      upsert: true,
    });

  if (error) {
    console.error(`[kyc-upload] Échec upload ${fileType}: ${error.message}`, { objectPath, userId });
    throw new Error(`Échec de l'enregistrement du document (${fileType}). Réessayez ou contactez le support.`);
  }

  const finalKb = Math.round(compressed.buffer.length / 1024);
  console.log(`[kyc-upload] OK — ${fileType} enregistré: ${objectPath} (${finalKb} Ko)`);
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

export async function listAllKycStorageFiles(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const paths: string[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: items, error } = await supabase.storage
      .from(KYC_BUCKET)
      .list("", { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });

    if (error || !items || items.length === 0) break;

    for (const item of items) {
      if (item.id) {
        paths.push(item.name);
      } else {
        let subOffset = 0;
        while (true) {
          const { data: subItems, error: subErr } = await supabase.storage
            .from(KYC_BUCKET)
            .list(item.name, { limit: pageSize, offset: subOffset });
          if (subErr || !subItems || subItems.length === 0) break;
          for (const sf of subItems) {
            paths.push(`${item.name}/${sf.name}`);
          }
          if (subItems.length < pageSize) break;
          subOffset += pageSize;
        }
      }
    }

    if (items.length < pageSize) break;
    offset += pageSize;
  }

  return paths;
}

export async function countOrphanedKycFiles(): Promise<{ count: number; sizeKb: number }> {
  const db = getDbSafe();
  const rows = await db
    .select({
      documentFrontPath: kycRequests.documentFrontPath,
      documentBackPath: kycRequests.documentBackPath,
      selfiePath: kycRequests.selfiePath,
    })
    .from(kycRequests);

  const referenced = new Set<string>();
  for (const r of rows) {
    for (const p of [r.documentFrontPath, r.documentBackPath, r.selfiePath]) {
      if (p) referenced.add(p);
    }
  }

  const allPaths = await listAllKycStorageFiles();
  const orphanedPaths = allPaths.filter((p) => !referenced.has(p));

  if (orphanedPaths.length === 0) return { count: 0, sizeKb: 0 };

  const supabase = getSupabaseAdmin();
  let sizeKb = 0;
  const byFolder = new Map<string, string[]>();
  for (const p of orphanedPaths) {
    const folder = p.includes("/") ? p.split("/")[0] : "";
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder)!.push(p);
  }
  for (const [folder, files] of Array.from(byFolder.entries())) {
    const { data: items } = await supabase.storage.from(KYC_BUCKET).list(folder, { limit: 1000 });
    for (const item of items || []) {
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      if (files.includes(fullPath)) {
        sizeKb += Math.round((item.metadata?.size || 0) / 1024);
      }
    }
  }

  return { count: orphanedPaths.length, sizeKb };
}

export async function cleanupOrphanedKycStorage(): Promise<{ deleted: number; errors: string[] }> {
  const db = getDbSafe();
  const rows = await db
    .select({
      documentFrontPath: kycRequests.documentFrontPath,
      documentBackPath: kycRequests.documentBackPath,
      selfiePath: kycRequests.selfiePath,
    })
    .from(kycRequests);

  const referenced = new Set<string>();
  for (const r of rows) {
    for (const p of [r.documentFrontPath, r.documentBackPath, r.selfiePath]) {
      if (p) referenced.add(p);
    }
  }

  const allPaths = await listAllKycStorageFiles();
  const orphanedPaths = allPaths.filter((p) => !referenced.has(p));

  if (orphanedPaths.length === 0) return { deleted: 0, errors: [] };

  const supabase = getSupabaseAdmin();
  const errors: string[] = [];
  let deleted = 0;
  const CHUNK = 500;

  for (let i = 0; i < orphanedPaths.length; i += CHUNK) {
    const chunk = orphanedPaths.slice(i, i + CHUNK);
    const { error } = await supabase.storage.from(KYC_BUCKET).remove(chunk);
    if (error) {
      errors.push(error.message);
    } else {
      deleted += chunk.length;
    }
  }

  console.log(`[kyc-cleanup-orphaned] ${deleted} fichier(s) orphelin(s) supprimés (non liés à un dossier KYC)`);
  return { deleted, errors };
}

export async function cleanupSupersededKycStorage(): Promise<{ deleted: number; usersAffected: number; errors: string[] }> {
  const db = getDbSafe();
  const rows = await db
    .select({
      id: kycRequests.id,
      userId: kycRequests.userId,
      createdAt: kycRequests.createdAt,
      documentFrontPath: kycRequests.documentFrontPath,
      documentBackPath: kycRequests.documentBackPath,
      selfiePath: kycRequests.selfiePath,
    })
    .from(kycRequests);

  const byUser = new Map<number, typeof rows>();
  for (const r of rows) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, []);
    byUser.get(r.userId)!.push(r);
  }

  const pathsToDelete: string[] = [];
  let usersAffected = 0;

  for (const userRows of Array.from(byUser.values())) {
    if (userRows.length <= 1) continue;
    userRows.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    const superseded = userRows.slice(1);
    if (superseded.length === 0) continue;
    usersAffected++;
    for (const s of superseded) {
      for (const p of [s.documentFrontPath, s.documentBackPath, s.selfiePath]) {
        if (p && !p.startsWith("http") && !p.startsWith("/uploads")) pathsToDelete.push(p);
      }
    }
  }

  if (pathsToDelete.length === 0) {
    return { deleted: 0, usersAffected: 0, errors: [] };
  }

  const supabase = getSupabaseAdmin();
  const errors: string[] = [];
  let deleted = 0;
  const CHUNK = 500;

  for (let i = 0; i < pathsToDelete.length; i += CHUNK) {
    const chunk = pathsToDelete.slice(i, i + CHUNK);
    const { error } = await supabase.storage.from(KYC_BUCKET).remove(chunk);
    if (error) {
      errors.push(error.message);
    } else {
      deleted += chunk.length;
    }
  }

  console.log(`[kyc-cleanup-smart] ${deleted} fichier(s) superflus supprimés (${usersAffected} utilisateur(s) concerné(s))`);
  return { deleted, usersAffected, errors };
}

export async function countSupersededKycFiles(): Promise<{ count: number; usersAffected: number }> {
  const db = getDbSafe();
  const rows = await db
    .select({
      userId: kycRequests.userId,
      createdAt: kycRequests.createdAt,
      documentFrontPath: kycRequests.documentFrontPath,
      documentBackPath: kycRequests.documentBackPath,
      selfiePath: kycRequests.selfiePath,
    })
    .from(kycRequests);

  const byUser = new Map<number, typeof rows>();
  for (const r of rows) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, []);
    byUser.get(r.userId)!.push(r);
  }

  let count = 0;
  let usersAffected = 0;
  for (const userRows of Array.from(byUser.values())) {
    if (userRows.length <= 1) continue;
    usersAffected++;
    count += (userRows.length - 1) * 3;
  }

  return { count, usersAffected };
}

export async function deleteKycImagesById(kycIds: number[]): Promise<{ deleted: number; freed: number; errors: string[] }> {
  const db = getDbSafe();
  const rows = await db
    .select({
      id: kycRequests.id,
      documentFrontPath: kycRequests.documentFrontPath,
      documentBackPath: kycRequests.documentBackPath,
      selfiePath: kycRequests.selfiePath,
    })
    .from(kycRequests)
    .where(inArray(kycRequests.id, kycIds));

  const pathsToDelete: string[] = [];
  for (const r of rows) {
    for (const p of [r.documentFrontPath, r.documentBackPath, r.selfiePath]) {
      if (p && !p.startsWith("http") && !p.startsWith("/uploads")) pathsToDelete.push(p);
    }
  }

  if (pathsToDelete.length === 0) return { deleted: 0, freed: 0, errors: [] };

  const url = getCredential("SUPABASE_URL");
  const key = getCredential("SUPABASE_SERVICE_ROLE_KEY");
  const errors: string[] = [];
  let deleted = 0;
  let freed = 0;

  if (url && key) {
    const CHUNK = 500;
    for (let i = 0; i < pathsToDelete.length; i += CHUNK) {
      const chunk = pathsToDelete.slice(i, i + CHUNK);
      try {
        const res = await fetch(`${url}/storage/v1/object/${KYC_BUCKET}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${key}`,
            apikey: key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prefixes: chunk }),
        });
        const data = await res.json() as any[];
        if (res.ok && Array.isArray(data)) {
          deleted += data.length;
          freed += data.reduce((sum: number, f: any) => sum + (f.metadata?.size || 0), 0);
        } else {
          const errMsg = res.ok ? "Réponse inattendue" : (data as any)?.message || `HTTP ${res.status}`;
          errors.push(errMsg);
        }
      } catch (err) {
        errors.push((err as Error).message);
      }
    }
  } else {
    errors.push("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non configuré");
  }

  // Vider les chemins en base même si des erreurs partielles
  if (deleted > 0 || errors.length === 0) {
    for (const r of rows) {
      await db.update(kycRequests)
        .set({ documentFrontPath: sql`null`, documentBackPath: sql`null`, selfiePath: sql`null` })
        .where(eq(kycRequests.id, r.id));
    }
  }

  return { deleted, freed, errors };
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
