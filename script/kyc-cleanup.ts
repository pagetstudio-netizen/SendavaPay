import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const { Pool } = pg;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL;
const KYC_BUCKET = "kyc_documents";

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_DATABASE_URL) {
    console.error("❌ Clés manquantes:", {
      SUPABASE_URL: !!SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_DATABASE_URL: !!SUPABASE_DATABASE_URL,
    });
    process.exit(1);
  }

  // Diagnostic de la clé
  console.log("🔑 Diagnostic clés:");
  console.log("  SUPABASE_URL longueur:", SUPABASE_URL.length, "| début:", SUPABASE_URL.substring(0, 30));
  console.log("  SERVICE_ROLE_KEY longueur:", SUPABASE_SERVICE_ROLE_KEY.length);
  console.log("  SERVICE_ROLE_KEY début:", SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + "...");
  console.log("  SERVICE_ROLE_KEY fin: ..." + SUPABASE_SERVICE_ROLE_KEY.substring(SUPABASE_SERVICE_ROLE_KEY.length - 20));

  // Connexion Supabase Storage
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Test connexion Storage
  console.log("\n📦 Test connexion Supabase Storage...");
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) {
    console.error("❌ Erreur Storage:", bucketsErr.message);
    console.log("   → La clé SUPABASE_SERVICE_ROLE_KEY est peut-être incorrecte ou tronquée.");
    console.log("   → Vérifiez dans Supabase → Settings → API → service_role key");
  } else {
    console.log("✅ Buckets disponibles:", buckets?.map((b) => b.name).join(", ") || "aucun");
  }

  // Connexion base de données Supabase
  console.log("\n🗄️  Connexion base de données Supabase...");
  const cleanUrl = SUPABASE_DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/\?$/, "");
  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const client = await pool.connect();
  const { rows } = await client.query(
    "SELECT id, user_id, status, document_front_path, document_back_path, selfie_path, created_at FROM kyc_requests ORDER BY user_id, created_at DESC"
  );
  client.release();
  console.log("✅ Dossiers KYC en base:", rows.length);

  // Identifier fichiers superflus (sans avoir besoin du storage API)
  const byUser = new Map<number, typeof rows>();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id)!.push(r);
  }

  const supersededPaths: string[] = [];
  const keptPaths = new Set<string>();
  let usersAffected = 0;

  for (const userRows of byUser.values()) {
    // userRows déjà trié DESC par created_at → le premier est le plus récent
    const newest = userRows[0];
    for (const p of [newest.document_front_path, newest.document_back_path, newest.selfie_path]) {
      if (p) keptPaths.add(p);
    }
    if (userRows.length <= 1) continue;
    usersAffected++;
    const old = userRows.slice(1);
    for (const r of old) {
      for (const p of [r.document_front_path, r.document_back_path, r.selfie_path]) {
        if (p && !p.startsWith("http") && !p.startsWith("/uploads")) {
          supersededPaths.push(p);
        }
      }
    }
  }

  console.log("\n=== Résultat du scan ===");
  console.log("Fichiers superflus (anciennes soumissions):", supersededPaths.length, "|", usersAffected, "utilisateurs");
  console.log("Fichiers actifs protégés:", keptPaths.size);

  if (supersededPaths.length > 0) {
    console.log("\nAperçu des 5 premiers à supprimer:", supersededPaths.slice(0, 5));
  }

  // Si le storage fonctionne, lister aussi les orphelins
  if (!bucketsErr) {
    console.log("\n📂 Listage des fichiers dans le bucket", KYC_BUCKET, "...");
    const allFiles: string[] = [];
    let offset = 0;
    while (true) {
      const { data: items, error: listErr } = await supabase.storage
        .from(KYC_BUCKET)
        .list("", { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (listErr) { console.error("Erreur liste:", listErr.message); break; }
      if (!items || items.length === 0) break;
      for (const item of items) {
        if (item.id) {
          allFiles.push(item.name);
        } else {
          const { data: subItems } = await supabase.storage.from(KYC_BUCKET).list(item.name, { limit: 1000 });
          for (const sf of subItems || []) allFiles.push(`${item.name}/${sf.name}`);
        }
      }
      if (items.length < 1000) break;
      offset += 1000;
    }
    console.log("Fichiers dans Storage:", allFiles.length);

    const referenced = new Set<string>();
    for (const r of rows) {
      for (const p of [r.document_front_path, r.document_back_path, r.selfie_path]) {
        if (p && !p.startsWith("http")) referenced.add(p);
      }
    }
    const orphans = allFiles.filter((p) => !referenced.has(p));
    console.log("Fichiers orphelins:", orphans.length);

    const allToDelete = [...new Set([...orphans, ...supersededPaths])];
    console.log("\n🗑️  Total à supprimer:", allToDelete.length, "fichiers");

    if (allToDelete.length === 0) {
      console.log("✅ Rien à supprimer !");
      await pool.end();
      return;
    }

    // Suppression par chunks de 500
    let deleted = 0;
    const errors: string[] = [];
    const CHUNK = 500;
    for (let i = 0; i < allToDelete.length; i += CHUNK) {
      const chunk = allToDelete.slice(i, i + CHUNK);
      const { error: delErr } = await supabase.storage.from(KYC_BUCKET).remove(chunk);
      if (delErr) {
        errors.push(delErr.message);
        console.error(`❌ Erreur suppression chunk ${i}-${i + chunk.length}:`, delErr.message);
      } else {
        deleted += chunk.length;
        console.log(`✅ Chunk ${i}-${i + chunk.length}: ${chunk.length} fichiers supprimés`);
      }
    }

    console.log("\n=== Nettoyage terminé ===");
    console.log("✅ Supprimés:", deleted);
    if (errors.length > 0) console.log("❌ Erreurs:", errors);
  } else {
    console.log("\n⚠️  Nettoyage Storage impossible — corrigez SUPABASE_SERVICE_ROLE_KEY d'abord.");
    console.log("   Les 60 fichiers superflus identifiés seront supprimés une fois la clé corrigée.");
  }

  await pool.end();
}

main().catch((err) => {
  console.error("ERREUR FATALE:", err.message);
  process.exit(1);
});
