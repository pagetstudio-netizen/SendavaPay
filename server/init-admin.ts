import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { log } from "./index";

const ADMIN_EMAIL_1 = process.env.ADMIN_EMAIL_1?.trim();
const ADMIN_EMAIL_2 = process.env.ADMIN_EMAIL_2?.trim();
const ADMIN_PHONE_1 = process.env.ADMIN_PHONE_1?.trim();
const ADMIN_PHONE_2 = process.env.ADMIN_PHONE_2?.trim();
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD;

export const ADMIN_WHITELIST = [ADMIN_EMAIL_1, ADMIN_EMAIL_2]
  .filter((email): email is string => Boolean(email))
  .map((email) => email.toLowerCase()) as readonly string[];

export function isAdminWhitelisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ADMIN_WHITELIST as readonly string[]).includes(email.toLowerCase().trim());
}

async function ensureAdminAccount(
  email: string,
  phone: string,
  name: string,
  isFirst: boolean,
  bootstrapPassword: string,
) {
  const existing = await storage.getUserByEmail(email);

  if (existing) {
    // Un compte existant n'est jamais promu automatiquement par son e-mail.
    // L'élévation de privilège doit rester une action faite par un administrateur
    // déjà authentifié dans l'interface d'administration.
    log(`Bootstrap admin ignoré : le compte existe déjà`, "init");
    return existing;
  }

  const hashedPassword = await bcrypt.hash(bootstrapPassword, 12);
  const admin = await storage.createUser({
    fullName: name,
    email,
    phone,
    password: hashedPassword,
  });
  await storage.updateUser(admin.id, { role: "admin", isVerified: true });

  log("Compte administrateur créé par bootstrap explicite", "init");

  if (isFirst) {
    const existingCommission = await storage.getCommissionSettings();
    if (!existingCommission) {
      await storage.updateCommissionSettings("7.00", "7.00", "7.00", admin.id);
      log("Paramètres de commission initialisés (7%)", "init");
    }
    await storage.initializeSocialLinks();
    log("Liens réseaux sociaux initialisés", "init");
  }

  return admin;
}

export async function initializeAdminAccount() {
  try {
    const bootstrapEntries = [
      { email: ADMIN_EMAIL_1, phone: ADMIN_PHONE_1, name: "Administrateur principal", isFirst: true },
      { email: ADMIN_EMAIL_2, phone: ADMIN_PHONE_2, name: "Administrateur secondaire", isFirst: false },
    ].filter((entry): entry is { email: string; phone: string; name: string; isFirst: boolean } =>
      Boolean(entry.email && entry.phone),
    );

    if (!ADMIN_DEFAULT_PASSWORD || bootstrapEntries.length === 0) {
      log("Bootstrap administrateur ignoré : aucune configuration explicite fournie", "init");
      return;
    }

    for (const entry of bootstrapEntries) {
      await ensureAdminAccount(entry.email, entry.phone, entry.name, entry.isFirst, ADMIN_DEFAULT_PASSWORD);
    }
    log("Bootstrap administrateur explicite terminé", "init");
  } catch (error) {
    log(`Erreur lors de l'initialisation admin: ${error}`, "init");
    throw error;
  }
}
