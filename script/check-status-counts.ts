import pg from "pg";
const { Pool } = pg;

const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "";
const cleanUrl = rawUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?&/, "?").replace(/\?$/, "");
const pool = new Pool({ connectionString: cleanUrl, ssl: rawUrl.includes("supabase") ? { rejectUnauthorized: false } : false });

async function run() {
  const c = await pool.connect();
  try {
    const tables = [
      "transactions",
      "leekpay_payments",
      "api_transactions",
      "withdrawal_requests",
      "partner_transactions",
    ];

    for (const table of tables) {
      try {
        const r = await c.query(`SELECT status::text, COUNT(*) as cnt FROM ${table} GROUP BY status ORDER BY cnt DESC`);
        console.log(`\n=== ${table} (par statut) ===`);
        for (const row of r.rows) console.log(`  ${row.status}: ${row.cnt}`);
      } catch(e: any) { console.log(`  Erreur ${table}: ${e.message}`); }
    }

    // Recent transactions last 7 days by status
    console.log("\n\n=== ACTIVITÉ 7 DERNIERS JOURS ===");
    for (const [table, dateCol] of [["transactions","created_at"],["leekpay_payments","created_at"],["api_transactions","created_at"],["withdrawal_requests","created_at"]] as [string,string][]) {
      try {
        const r = await c.query(`SELECT status::text, COUNT(*) as cnt FROM ${table} WHERE ${dateCol} > NOW() - INTERVAL '7 days' GROUP BY status ORDER BY cnt DESC`);
        console.log(`\n${table} (7j):`);
        for (const row of r.rows) console.log(`  ${row.status}: ${row.cnt}`);
      } catch(e: any) { console.log(`  Erreur ${table}: ${e.message}`); }
    }

    // Check leekpay_payments with any non-completed/failed status in detail
    console.log("\n\n=== LEEKPAY_PAYMENTS non terminés (détail) ===");
    try {
      const r = await c.query(`
        SELECT l.id, l.user_id, u.full_name, l.leekpay_payment_id,
          l.amount::text, l.currency, l.type, l.status::text,
          l.payment_method, l.payer_country, l.created_at,
          ROUND(EXTRACT(EPOCH FROM (NOW() - l.created_at))/3600)::int AS heures
        FROM leekpay_payments l
        LEFT JOIN users u ON u.id = l.user_id
        WHERE l.status NOT IN ('completed','failed','cancelled','expired')
        ORDER BY l.created_at ASC
        LIMIT 50
      `);
      if (r.rowCount === 0) { console.log("  (aucun)"); }
      for (const r2 of r.rows) {
        console.log(`  [${r2.heures}h] #${r2.id} user=${r2.full_name||r2.user_id} type=${r2.type} ${r2.amount} ${r2.currency} méthode=${r2.payment_method||"?"} pays=${r2.payer_country||"?"} payId=${r2.leekpay_payment_id||"?"} créé=${r2.created_at?.toISOString?.()}`);
      }
    } catch(e: any) { console.log(`  Erreur: ${e.message}`); }

    // Check withdrawal_requests non terminés
    console.log("\n\n=== WITHDRAWAL_REQUESTS non terminés (détail) ===");
    try {
      const r = await c.query(`
        SELECT w.id, w.user_id, u.full_name, w.amount::text, w.net_amount::text,
          w.payment_method, w.mobile_number, w.country, w.status::text,
          w.external_reference, w.created_at,
          ROUND(EXTRACT(EPOCH FROM (NOW() - w.created_at))/3600)::int AS heures
        FROM withdrawal_requests w
        LEFT JOIN users u ON u.id = w.user_id
        WHERE w.status NOT IN ('approved','rejected','failed')
        ORDER BY w.created_at ASC
        LIMIT 50
      `);
      if (r.rowCount === 0) { console.log("  (aucun)"); }
      for (const r2 of r.rows) {
        console.log(`  [${r2.heures}h] #${r2.id} user=${r2.full_name||r2.user_id} ${r2.amount} ${r2.payment_method} ${r2.mobile_number} ${r2.country} status=${r2.status} extRef=${r2.external_reference||"?"}`);
      }
    } catch(e: any) { console.log(`  Erreur: ${e.message}`); }

  } finally {
    c.release();
    await pool.end();
  }
}

run().catch(e => { console.error("Erreur:", e.message); process.exit(1); });
