// Toutes les clés API sont définies UNIQUEMENT dans les variables d'environnement Plesk/système.
// Elles ne sont jamais stockées en base de données.
export const CREDENTIAL_KEYS: readonly string[] = [] as const;

export type CredentialKey = never;

export function getCredential(key: string): string {
  return process.env[key] || "";
}

/** No-op conservé pour compatibilité d'import — les clés viennent uniquement de l'environnement. */
export function setCachedCredential(_key: string, _value: string): void {}

/** No-op conservé pour compatibilité d'import — les clés viennent uniquement de l'environnement. */
export async function loadCredentialsFromDb(
  _getSetting: (key: string) => Promise<string | null>
): Promise<void> {}
