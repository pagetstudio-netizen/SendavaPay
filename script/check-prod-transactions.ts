import pg from "pg";
const { Pool } = pg;

const rawUrl = process.env.PROD_DATABASE_URL || "";
if (!rawUrl) { console.error("PROD_DATABASE_URL manquant"); process.exit(1); }
const cleanUrl = rawUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?&/, "?").replace(/\?$/, "");
const useSSL = rawUrl.includes("supabase") || rawUrl.includes("amazonaws") || rawUrl.includes(".com");

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 2,
  connectionTimeoutMillis: 15000,
});

async function run() {
  const c = await pool.connect();
  console.log("✅ Connexion base de production OK\n");

  try {
    // 1. Vue d'ensemble par statut dans toutes les tables
    const tables = [
      ["transactions",       "status"],
      ["leekpay_payments",   "status"],
      ["api_transactions",   "status"],
      ["withdrawal_requests","status"],
      ["partner_transactions","status"],
    ] as [string, string][];

    console.log("========== VUE D'ENSEMBLE PAR STATUT ==========");
    for (const [table, col] of tables) {
      try {
        const r = await c.query(`SELECT ${col}::text, COUNT(*) AS cnt FROM ${table} GROUP BY ${col} ORDER BY cnt DESC`);
        console.log(`\n${table}:`);
        if (r.rowCount === 0) { console.log("  (vide)"); continue; }
        for (const row of r.rows) console.log(`  ${row[col]}: ${row.cnt}`);
      } catch(e: any) { console.log(`  Erreur: ${e.message}`); }
    }

    // 2. Transactions bloquées - leekpay_payments
    console.log("\n\n========== LEEKPAY_PAYMENTS BLOQUÉS ==========");
    try {
      const r = await c.query(`
        SELECT l.id, l.user_id, u.full_name, l.leekpay_payment_id,
          l.amount::text, l.currency, l.type, l.status::text,
          l.payment_method, l.payer_country,
          TO_CHAR(l.created_at, 'DD/MM/YYYY HH24:MI') AS cree_le,
          ROUND(EXTRACT(EPOCH FROM (NOW() - l.created_at))/3600)::int AS heures
        FROM leekpay_payments l
        LEFT JOIN users u ON u.id = l.user_id
        WHERE l.status NOT IN ('completed','failed','cancelled','expired')
        ORDER BY l.created_at ASC
        LIMIT 100
      `);
      console.log(`Total: ${r.rowCount}`);
      for (const r2 of r.rows) console.log(`  #${r2.id} | status=${r2.status}`);
    } catch(e: any) { console.log(`Erreur: ${e.message}`); }

    // 3. Transactions (deposits) bloquées
    console.log("\n\n========== TRANSACTIONS (dépôts) EN ATTENTE ==========");
    try {
      const r = await c.query(`
        SELECT t.id, t.user_id, u.full_name, t.type::text, t.amount::text,
          t.status::text, t.payment_method, t.payer_country, t.external_ref,
          TO_CHAR(t.created_at, 'DD/MM/YYYY HH24:MI') AS cree_le,
          ROUND(EXTRACT(EPOCH FROM (NOW() - t.created_at))/3600)::int AS heures
        FROM transactions t
        LEFT JOIN users u ON u.id = t.user_id
        WHERE t.status = 'pending'
        ORDER BY t.created_at ASC
        LIMIT 100
      `);
      console.log(`Total: ${r.rowCount}`);
      for (const r2 of r.rows) console.log(`  #${r2.id} | status=${r2.status}`);
    } catch(e: any) { console.log(`Erreur: ${e.message}`); }

    // 4. API transactions bloquées
    console.log("\n\n========== API_TRANSACTIONS BLOQUÉES ==========");
    try {
      const r = await c.query(`
        SELECT a.id, a.user_id, u.full_name, a.reference,
          a.type::text, a.amount::text, a.currency, a.status::text,
          a.payment_method, a.payer_country, a.external_reference,
          TO_CHAR(a.created_at, 'DD/MM/YYYY HH24:MI') AS cree_le,
          ROUND(EXTRACT(EPOCH FROM (NOW() - a.created_at))/3600)::int AS heures
        FROM api_transactions a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.status IN ('pending','processing','queued','provider_pending')
        ORDER BY a.created_at ASC
        LIMIT 100
      `);
      console.log(`Total: ${r.rowCount}`);
      for (const r2 of r.rows) console.log(`  #${r2.id} | status=${r2.status}`);
    } catch(e: any) { console.log(`Erreur: ${e.message}`); }

    // 5. Retraits bloqués
    console.log("\n\n========== WITHDRAWAL_REQUESTS BLOQUÉS ==========");
    try {
      const r = await c.query(`
        SELECT w.id, w.user_id, u.full_name, w.amount::text, w.net_amount::text,
          w.payment_method, w.mobile_number, w.country, w.status::text,
          w.external_reference,
          TO_CHAR(w.created_at, 'DD/MM/YYYY HH24:MI') AS cree_le,
          ROUND(EXTRACT(EPOCH FROM (NOW() - w.created_at))/3600)::int AS heures
        FROM withdrawal_requests w
        LEFT JOIN users u ON u.id = w.user_id
        WHERE w.status IN ('pending','processing')
        ORDER BY w.created_at ASC
        LIMIT 100
      `);
      console.log(`Total: ${r.rowCount}`);
      for (const r2 of r.rows) console.log(`  #${r2.id} | status=${r2.status}`);
    } catch(e: any) { console.log(`Erreur: ${e.message}`); }

    // 6. Partner transactions bloquées
    console.log("\n\n========== PARTNER_TRANSACTIONS BLOQUÉES ==========");
    try {
      const r = await c.query(`
        SELECT pt.id, pt.partner_id, p.name AS partner_name, pt.reference,
          pt.amount::text, pt.currency, pt.status::text,
          pt.customer_phone, pt.payment_method,
          TO_CHAR(pt.created_at, 'DD/MM/YYYY HH24:MI') AS cree_le,
          ROUND(EXTRACT(EPOCH FROM (NOW() - pt.created_at))/3600)::int AS heures
        FROM partner_transactions pt
        LEFT JOIN partners p ON p.id = pt.partner_id
        WHERE pt.status IN ('pending','processing','queued','provider_pending')
        ORDER BY pt.created_at ASC
        LIMIT 100
      `);
      console.log(`Total: ${r.rowCount}`);
      for (const r2 of r.rows) console.log(`  #${r2.id} | status=${r2.status}`);
    } catch(e: any) { console.log(`Erreur: ${e.message}`); }

  } finally {
    c.release();
    await pool.end();
  }
}

run().catch(e => { console.error("Erreur fatale:", e.message); process.exit(1); });
