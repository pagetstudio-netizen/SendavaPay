import { v4 as uuidv4 } from "uuid";
import { pool } from "./db";
import { sendEmail } from "./email";

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createOtp(
  userId: number,
  type: "admin_login" | "withdrawal",
  ipAddress: string,
  metadata?: Record<string, unknown>
): Promise<{ token: string; code: string }> {
  if (!pool) throw new Error("Base de données non disponible");

  const code = generateOtpCode();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO otp_codes (user_id, code, type, token, expires_at, ip_address, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, code, type, token, expiresAt.toISOString(), ipAddress, metadata ? JSON.stringify(metadata) : null]
    );
  } finally {
    client.release();
  }
  return { token, code };
}

export async function verifyOtp(
  token: string,
  code: string,
  type: "admin_login" | "withdrawal"
): Promise<{ valid: boolean; userId?: number; metadata?: Record<string, unknown>; errorMsg?: string }> {
  if (!pool) return { valid: false, errorMsg: "Base de données non disponible" };

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM otp_codes WHERE token=$1 AND type=$2 LIMIT 1`,
      [token, type]
    );
    const otp = result.rows[0];
    if (!otp) return { valid: false, errorMsg: "Code invalide ou expiré" };
    if (otp.used_at) return { valid: false, errorMsg: "Ce code a déjà été utilisé" };
    if (new Date(otp.expires_at) < new Date()) return { valid: false, errorMsg: "Code expiré. Veuillez en demander un nouveau." };
    if (otp.code !== code) return { valid: false, errorMsg: "Code incorrect" };

    await client.query(`UPDATE otp_codes SET used_at=NOW() WHERE id=$1`, [otp.id]);

    let metadata: Record<string, unknown> | undefined;
    if (otp.metadata) {
      try { metadata = JSON.parse(otp.metadata); } catch { metadata = undefined; }
    }
    return { valid: true, userId: otp.user_id, metadata };
  } finally {
    client.release();
  }
}

export async function cleanExpiredOtps(): Promise<void> {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour'`);
  } finally {
    client.release();
  }
}

export async function sendWithdrawalOtp(
  email: string,
  fullName: string,
  code: string,
  amount: string,
  currency: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Code de confirmation de retrait - SendavaPay",
    html: `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}
  .container{max-width:600px;margin:0 auto;background:#fff}
  .header{background:linear-gradient(135deg,#059669,#10b981);padding:30px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:24px}
  .content{padding:40px 30px}
  .code-box{background:#f0fdf4;border:2px dashed #059669;border-radius:12px;padding:25px;text-align:center;margin:25px 0}
  .code{font-size:44px;font-weight:900;letter-spacing:10px;color:#059669;font-family:monospace}
  .warning{background:#fffbeb;border-left:4px solid #f59e0b;padding:15px;border-radius:0 8px 8px 0;margin:20px 0;font-size:13px}
  .footer{background:#f9fafb;padding:20px 30px;text-align:center;color:#6b7280;font-size:12px}
  .amount{font-size:22px;font-weight:700;color:#059669;text-align:center;margin:10px 0}
</style></head>
<body><div class="container">
  <div class="header"><h1>SendavaPay — Confirmation de retrait</h1></div>
  <div class="content">
    <h2>Bonjour ${fullName},</h2>
    <p>Une demande de retrait a été initiée sur votre compte :</p>
    <div class="amount">Montant : ${amount} ${currency}</div>
    <p>Pour confirmer ce retrait, entrez ce code dans l'application :</p>
    <div class="code-box">
      <div class="code">${code}</div>
      <p style="margin:10px 0 0;color:#6b7280;font-size:13px">Valide pendant <strong>10 minutes</strong></p>
    </div>
    <div class="warning">
      <strong>⚠️ Vérifiez vos spams</strong> si vous ne voyez pas cet email.<br><br>
      <strong>🔒 Ne partagez jamais ce code.</strong> SendavaPay ne vous demandera jamais votre code par téléphone ou message.
    </div>
    <p>Si vous n'avez pas initié ce retrait, ignorez cet email et votre compte reste sécurisé.</p>
    <p>L'équipe SendavaPay</p>
  </div>
  <div class="footer">SendavaPay — Paiements Mobile Money en Afrique de l'Ouest<br>Cet email est automatique, merci de ne pas répondre.</div>
</div></body></html>`,
    text: `Code de confirmation de retrait SendavaPay : ${code}\nMontant : ${amount} ${currency}\nValide 10 minutes.\n\nVérifiez vos spams si vous ne trouvez pas cet email.`,
  });
}

export async function sendAdminLoginOtp(
  email: string,
  fullName: string,
  code: string,
  ip: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: "🔐 Code de connexion administrateur - SendavaPay",
    html: `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}
  .container{max-width:600px;margin:0 auto;background:#fff}
  .header{background:linear-gradient(135deg,#1e40af,#3b82f6);padding:30px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:24px}
  .content{padding:40px 30px}
  .code-box{background:#eff6ff;border:2px dashed #3b82f6;border-radius:12px;padding:25px;text-align:center;margin:25px 0}
  .code{font-size:44px;font-weight:900;letter-spacing:10px;color:#1e40af;font-family:monospace}
  .alert{background:#fef2f2;border-left:4px solid #dc2626;padding:15px;border-radius:0 8px 8px 0;margin:20px 0;font-size:13px}
  .footer{background:#f9fafb;padding:20px 30px;text-align:center;color:#6b7280;font-size:12px}
</style></head>
<body><div class="container">
  <div class="header"><h1>🔐 Connexion Administrateur</h1></div>
  <div class="content">
    <h2>Bonjour ${fullName},</h2>
    <p>Une tentative de connexion au panneau d'administration a été détectée depuis :</p>
    <p><strong>Adresse IP :</strong> <code>${ip}</code></p>
    <p>Votre code de vérification :</p>
    <div class="code-box">
      <div class="code">${code}</div>
      <p style="margin:10px 0 0;color:#6b7280;font-size:13px">Valide pendant <strong>10 minutes</strong></p>
    </div>
    <div class="alert">
      <strong>⚠️ Ce n'est pas vous ?</strong><br>
      Si vous n'avez pas tenté de vous connecter, changez immédiatement votre mot de passe et contactez l'équipe de sécurité.<br><br>
      <strong>Toutes vos autres sessions administrateur ont été déconnectées.</strong>
    </div>
    <p>⚠️ <em>Vérifiez vos spams si vous ne voyez pas cet email.</em></p>
  </div>
  <div class="footer">SendavaPay — Système d'administration sécurisé</div>
</div></body></html>`,
    text: `Code de connexion admin SendavaPay : ${code}\nIP : ${ip}\nValide 10 minutes.\n\nSi ce n'est pas vous, changez votre mot de passe immédiatement.`,
  });
}

setInterval(() => cleanExpiredOtps().catch(() => {}), 60 * 60 * 1000);
