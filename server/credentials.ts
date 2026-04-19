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
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export type CredentialKey = (typeof CREDENTIAL_KEYS)[number];

const cache: Partial<Record<string, string>> = {};

export function getCredential(key: string): string {
  if (key in cache) return cache[key] as string;
  return process.env[key] || "";
}

export function setCachedCredential(key: string, value: string): void {
  if (value === "") {
    delete cache[key];
  } else {
    cache[key] = value;
  }
}

export async function loadCredentialsFromDb(
  getSetting: (key: string) => Promise<string | null>
): Promise<void> {
  for (const key of CREDENTIAL_KEYS) {
    try {
      const val = await getSetting(`cred_${key}`);
      if (val !== null && val !== "") {
        cache[key] = val;
      } else {
        delete cache[key];
      }
    } catch {
      // If DB not available yet, skip silently
    }
  }
}
