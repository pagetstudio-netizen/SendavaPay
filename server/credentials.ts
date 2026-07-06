// ⚠️ RÈGLE DE SÉCURITÉ CRITIQUE :
// Ne jamais ajouter ici des clés qui donnent un accès destructif à la base de données
// (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, DATABASE_URL, SESSION_SECRET).
// Ces clés DOIVENT être uniquement dans les variables d'environnement Plesk/système —
// jamais en base, car un attaquant ayant accès à la DB pourrait les lire et tout détruire.
export const CREDENTIAL_KEYS = [
  "OMNIPAY_API_KEY",
  "OMNIPAY_CALLBACK_KEY",
  "MAISHAPAY_PUBLIC_KEY",
  "MAISHAPAY_SECRET_KEY",
  "SOLEASPAY_API_KEY",
  "SOLEASPAY_SECRET_KEY",
  "PAXITY_API_KEY",
  "PAXITY_API_TOKEN",
  "PAXITY_JWT_TOKEN",
  "MBIYOPAY_API_KEY",
  "PAYDUNYA_MASTER_KEY",
  "PAYDUNYA_PRIVATE_KEY",
  "PAYDUNYA_TOKEN",
  "PAYDUNYA_PUBLIC_KEY",
  "PAYDUNYA_BASE_URL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "LEEKPAY_SECRET_KEY",
  "LEEKPAY_PUBLIC_KEY",
] as const;

// Clés réservées aux variables d'environnement UNIQUEMENT — jamais en base
export const ENV_ONLY_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DATABASE_URL",
  "DATABASE_URL",
  "SESSION_SECRET",
] as const;

export type CredentialKey = (typeof CREDENTIAL_KEYS)[number];

const cache: Partial<Record<string, string>> = {};

export function getCredential(key: string): string {
  if (key in cache) return cache[key] as string;
  return process.env[key] || "";
}

export function setCachedCredential(key: string, value: string): void {
  // Si une variable d'environnement existe, elle garde toujours la priorité
  // L'admin panel ne peut pas l'écraser
  if (process.env[key]) return;
  if (value === "") {
    delete cache[key];
  } else {
    cache[key] = value;
  }
}

export async function loadCredentialsFromDb(
  getSetting: (key: string) => Promise<string | null>
): Promise<void> {
  let fromEnv = 0;
  let fromDb = 0;

  for (const key of CREDENTIAL_KEYS) {
    try {
      // Les variables d'environnement (Plesk/système) ont TOUJOURS la priorité
      // sur les valeurs stockées en base via le panneau admin.
      // Cela évite qu'une modification accidentelle dans l'admin n'écrase les vraies clés.
      if (process.env[key]) {
        cache[key] = process.env[key]!;
        fromEnv++;
        continue;
      }

      const val = await getSetting(`cred_${key}`);
      if (val !== null && val !== "") {
        cache[key] = val;
        fromDb++;
      } else {
        delete cache[key];
      }
    } catch {
      // DB pas encore disponible — on continue sans crasher
    }
  }

  console.log(`[credentials] Chargement: ${fromEnv} depuis variables env, ${fromDb} depuis base de données`);
}
