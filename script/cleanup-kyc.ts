import { createClient } from "@supabase/supabase-js";

const KYC_BUCKET = "kyc_documents";

async function deleteAllKycFiles() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log(`Connexion Supabase OK — nettoyage du bucket: ${KYC_BUCKET}`);

  let totalDeleted = 0;
  const errors: string[] = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data: items, error: listError } = await supabase.storage
      .from(KYC_BUCKET)
      .list("", { limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } });

    if (listError) {
      console.error("Erreur listage racine:", listError.message);
      errors.push(listError.message);
      break;
    }

    if (!items || items.length === 0) break;

    const filePaths: string[] = [];
    const folderNames: string[] = [];

    for (const item of items) {
      if (item.id) {
        filePaths.push(item.name);
      } else {
        folderNames.push(item.name);
      }
    }

    // List files inside subfolders (user_XXXX/)
    for (const folder of folderNames) {
      let subOffset = 0;
      while (true) {
        const { data: subItems, error: subErr } = await supabase.storage
          .from(KYC_BUCKET)
          .list(folder, { limit: PAGE_SIZE, offset: subOffset });

        if (subErr) {
          errors.push(`Erreur dossier ${folder}: ${subErr.message}`);
          break;
        }
        if (!subItems || subItems.length === 0) break;

        for (const sf of subItems) {
          filePaths.push(`${folder}/${sf.name}`);
        }

        if (subItems.length < PAGE_SIZE) break;
        subOffset += PAGE_SIZE;
      }
    }

    if (filePaths.length > 0) {
      console.log(`  Suppression de ${filePaths.length} fichier(s)...`);
      const { error: delError } = await supabase.storage
        .from(KYC_BUCKET)
        .remove(filePaths);

      if (delError) {
        console.error("  Erreur suppression:", delError.message);
        errors.push(delError.message);
      } else {
        totalDeleted += filePaths.length;
        console.log(`  ✓ ${filePaths.length} fichier(s) supprimé(s)`);
      }
    }

    if (items.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log("\n========================================");
  console.log(`Total supprimé : ${totalDeleted} fichier(s)`);
  if (errors.length > 0) {
    console.log(`Erreurs (${errors.length}) :`);
    errors.forEach(e => console.log("  -", e));
  } else {
    console.log("Aucune erreur — bucket KYC entièrement vidé.");
  }
  console.log("========================================");
}

deleteAllKycFiles().catch(err => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
