import pg from "pg";

const { Pool } = pg;

const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "";
const cleanUrl = rawUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?&/, "?").replace(/\?$/, "");
const useSSL = rawUrl.includes("supabase");

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 2,
});

async function run() {
  const client = await pool.connect();
  try {
    // 1. Transactions bloquées (type deposit/transfer)
    const t1 = await client.query(`
      SELECT t.id, t.user_id, u.full_name, t.type::text, t.amount::text,
        t.status::text, t.payment_method, t.payer_country, t.external_ref,
        t.created_at,
        ROUND(EXTRACT(EPOCH FROM (NOW() - t.created_at))/3600) AS heures
      FROM transactions t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.status = 'pending'
      ORDER BY t.created_at ASC
    `);
    console.log(`\n=== TRANSACTIONS en attente: ${t1.rowCount} ===`);
    for (const r of t1.rows) {
      console.log(`  [${r.heures}h] #${r.id} user=${r.full_name||r.user_id} type=${r.type} montant=${r.amount} méthode=${r.payment_method||"?"} pays=${r.payer_country||"?"} extRef=${r.external_ref||"?"} créé=${r.created_at?.toISOString?.()}`);
    }

    // 2. LeekPay payments bloqués
    const t2 = await client.query(`
      SELECT l.id, l.user_id, u.full_name, l.leekpay_payment_id,
        l.amount::text, l.currency, l.type, l.status::text,
        l.payment_method, l.payer_country, l.created_at,
        ROUND(EXTRACT(EPOCH FROM (NOW() - l.created_at))/3600) AS heures
      FROM leekpay_payments l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE l.status IN ('pending','processing')
      ORDER BY l.created_at ASC
    `);
    console.log(`\n=== LEEKPAY_PAYMENTS bloqués: ${t2.rowCount} ===`);
    for (const r of t2.rows) {
      console.log(`  [${r.heures}h] #${r.id} user=${r.full_name||r.user_id} type=${r.type} montant=${r.amount} ${r.currency} méthode=${r.payment_method||"?"} pays=${r.payer_country||"?"} paymentId=${r.leekpay_payment_id||"?"}`);
    }

    // 3. API transactions bloquées
    const t3 = await client.query(`
      SELECT a.id, a.user_id, u.full_name, a.reference,
        a.type::text, a.amount::text, a.currency,
        a.status::text, a.payment_method, a.payer_country,
        a.external_reference, a.created_at,
        ROUND(EXTRACT(EPOCH FROM (NOW() - a.created_at))/3600) AS heures
      FROM api_transactions a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.status IN ('pending','processing','queued','provider_pending')
      ORDER BY a.created_at ASC
    `);
    console.log(`\n=== API_TRANSACTIONS bloquées: ${t3.rowCount} ===`);
    for (const r of t3.rows) {
      console.log(`  [${r.heures}h] #${r.id} ref=${r.reference} user=${r.full_name||r.user_id} type=${r.type} montant=${r.amount} ${r.currency} méthode=${r.payment_method||"?"} pays=${r.payer_country||"?"}`);
    }

    // 4. Retraits bloqués
    const t4 = await client.query(`
      SELECT w.id, w.user_id, u.full_name, w.amount::text, w.net_amount::text,
        w.payment_method, w.mobile_number, w.country,
        w.status::text, w.external_reference, w.transaction_reference,
        w.created_at,
        ROUND(EXTRACT(EPOCH FROM (NOW() - w.created_at))/3600) AS heures
      FROM withdrawal_requests w
      LEFT JOIN users u ON u.id = w.user_id
      WHERE w.status IN ('pending','processing')
      ORDER BY w.created_at ASC
    `);
    console.log(`\n=== WITHDRAWAL_REQUESTS bloqués: ${t4.rowCount} ===`);
    for (const r of t4.rows) {
      console.log(`  [${r.heures}h] #${r.id} user=${r.full_name||r.user_id} montant=${r.amount} méthode=${r.payment_method} tel=${r.mobile_number} pays=${r.country} extRef=${r.external_reference||"?"}`);
    }

    // 5. Résumé
    const total = (t1.rowCount||0) + (t2.rowCount||0) + (t3.rowCount||0) + (t4.rowCount||0);
    console.log(`\n========== RÉSUMÉ ==========`);
    console.log(`Transactions pending:       ${t1.rowCount}`);
    console.log(`LeekPay payments bloqués:   ${t2.rowCount}`);
    console.log(`API transactions bloquées:  ${t3.rowCount}`);
    console.log(`Retraits bloqués:           ${t4.rowCount}`);
    console.log(`TOTAL BLOQUÉ:               ${total}`);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error("Erreur:", err.message);
  process.exit(1);
});
