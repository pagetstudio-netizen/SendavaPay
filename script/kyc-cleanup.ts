import pg from "pg";

const { Pool } = pg;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL!;
const KYC_BUCKET = "kyc_documents";

// Appel direct à l'API REST Supabase Storage (bypass du client JS et de sa validation JWT)
async function storageRequest(path: string, method = "GET", body?: object) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function listAllStorageFiles(): Promise<string[]> {
  const paths: string[] = [];

  // Lister les dossiers (ex: user_123/)
  const { ok, json, status } = await storageRequest(`/object/list/${KYC_BUCKET}`, "POST", {
    prefix: "",
    limit: 1000,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });

  if (!ok) {
    console.error(`❌ Erreur listage racine (${status}):`, JSON.stringify(json));
    return paths;
  }

  const items: any[] = Array.isArray(json) ? json : [];
  console.log(`   Dossiers/fichiers à la racine: ${items.length}`);

  for (const item of items) {
    if (item.id) {
      // Fichier direct
      paths.push(item.name);
    } else {
      // Dossier — lister son contenu
      const sub = await storageRequest(`/object/list/${KYC_BUCKET}`, "POST", {
        prefix: item.name + "/",
        limit: 1000,
        offset: 0,
      });
      if (sub.ok && Array.isArray(sub.json)) {
        for (const sf of sub.json) {
          if (sf.name) paths.push(`${item.name}/${sf.name}`);
        }
      }
    }
  }

  return paths;
}

async function deleteFiles(paths: string[]): Promise<number> {
  if (paths.length === 0) return 0;
  let deleted = 0;
  const CHUNK = 500;

  for (let i = 0; i < paths.length; i += CHUNK) {
    const chunk = paths.slice(i, i + CHUNK);
    const res = await storageRequest(`/object/${KYC_BUCKET}`, "DELETE", { prefixes: chunk });
    if (res.ok) {
      const count = Array.isArray(res.json) ? res.json.length : chunk.length;
      deleted += count;
      console.log(`  ✅ Chunk ${i + 1}-${i + chunk.length}: ${count} fichier(s) supprimé(s)`);
    } else {
      console.error(`  ❌ Erreur suppression (${res.status}):`, JSON.stringify(res.json));
    }
  }

  return deleted;
}

async function main() {
  console.log("=== Diagnostic clés ===");
  console.log("  SUPABASE_URL:", SUPABASE_URL);
  console.log("  SERVICE_ROLE_KEY longueur:", SUPABASE_SERVICE_ROLE_KEY?.length);
  const dots = (SUPABASE_SERVICE_ROLE_KEY || "").split(".").length - 1;
  console.log("  Points dans la clé (doit être 2 pour un JWT valide):", dots);

  // Test connexion API Storage
  console.log("\n📦 Test connexion Storage API...");
  const testRes = await storageRequest(`/bucket/${KYC_BUCKET}`);
  if (!testRes.ok) {
    console.error(`❌ Connexion Storage échouée (${testRes.status}):`, JSON.stringify(testRes.json));
    console.log("\n⚠️  La clé service_role n'est pas valide. Elle contient", dots, "point(s) au lieu de 2.");
    console.log("   Une clé JWT valide a exactement 3 parties séparées par 2 points.");
    console.log("   Vérifiez dans Supabase → Settings → API → service_role et copiez la clé complète.");
    process.exit(1);
  }
  console.log("✅ Connexion Storage OK:", testRes.json?.name || JSON.stringify(testRes.json));

  // Connexion base de données
  const cleanUrl = SUPABASE_DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?&/, "?").replace(/\?$/, "");
  const pool = new Pool({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();

  // Lire les dossiers KYC
  console.log("\n🗄️  Lecture des dossiers KYC...");
  const { rows: kycRows } = await client.query(
    "SELECT id, user_id, status, document_front_path, document_back_path, selfie_path, created_at FROM kyc_requests ORDER BY user_id, created_at DESC"
  );
  console.log(`   ✅ ${kycRows.length} dossiers KYC en base`);
  client.release();
  await pool.end();

  // Lister les fichiers Storage
  console.log("\n📂 Listage des fichiers dans Storage...");
  const allFiles = await listAllStorageFiles();
  console.log(`   ✅ ${allFiles.length} fichiers dans le bucket\n`);

  // Fichiers référencés (à protéger)
  const referenced = new Set<string>();
  for (const r of kycRows) {
    for (const p of [r.document_front_path, r.document_back_path, r.selfie_path]) {
      if (p && !p.startsWith("http") && !p.startsWith("/uploads")) referenced.add(p);
    }
  }

  // Orphelins
  const orphans = allFiles.filter((p) => !referenced.has(p));

  // Superflus (anciennes soumissions par utilisateur)
  const byUser = new Map<number, typeof kycRows>();
  for (const r of kycRows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id)!.push(r);
  }
  const supersededPaths: string[] = [];
  let usersAffected = 0;
  for (const userRows of byUser.values()) {
    if (userRows.length <= 1) continue;
    usersAffected++;
    for (const r of userRows.slice(1)) {
      for (const p of [r.document_front_path, r.document_back_path, r.selfie_path]) {
        if (p && !p.startsWith("http") && !p.startsWith("/uploads")) supersededPaths.push(p);
      }
    }
  }

  const allToDelete = [...new Set([...orphans, ...supersededPaths])];

  console.log("=== RÉSUMÉ ===");
  console.log(`  Fichiers dans Storage     : ${allFiles.length}`);
  console.log(`  Orphelins                 : ${orphans.length}`);
  console.log(`  Superflus (résoumissions) : ${supersededPaths.length} (${usersAffected} utilisateurs)`);
  console.log(`  Total à supprimer         : ${allToDelete.length}`);
  console.log(`  Fichiers protégés         : ${allFiles.length - allToDelete.length}`);

  if (allToDelete.length === 0) {
    console.log("\n✅ Rien à supprimer — le stockage est déjà propre !");
    return;
  }

  console.log("\n🗑️  Suppression en cours...");
  const deleted = await deleteFiles(allToDelete);

  console.log("\n=== NETTOYAGE TERMINÉ ===");
  console.log(`✅ Fichiers supprimés : ${deleted} / ${allToDelete.length}`);
  console.log(`📦 Fichiers restants  : ~${allFiles.length - deleted}`);
}

main().catch((err) => {
  console.error("ERREUR FATALE:", err.message);
  process.exit(1);
});
