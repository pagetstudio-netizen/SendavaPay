import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { log } from "./index";

const ADMIN_EMAIL_1 = process.env.ADMIN_EMAIL_1 || "pagetstudio@gmail.com";
const ADMIN_EMAIL_2 = process.env.ADMIN_EMAIL_2 || "felidolayi@gmail.com";
const ADMIN_PHONE_1 = process.env.ADMIN_PHONE_1 || "+228 99935673";
const ADMIN_PHONE_2 = process.env.ADMIN_PHONE_2 || "+228 00000000";
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "AAbb11##";

export const ADMIN_WHITELIST = [ADMIN_EMAIL_1, ADMIN_EMAIL_2] as const;

export function isAdminWhitelisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ADMIN_WHITELIST as readonly string[]).includes(email.toLowerCase().trim());
}

async function ensureAdminAccount(
  email: string,
  phone: string,
  name: string,
  isFirst: boolean
) {
  const existing = await storage.getUserByEmail(email);

  if (existing) {
    const updates: Record<string, any> = { isVerified: true };
    if (existing.role !== "admin") {
      updates.role = "admin";
      log(`Rôle administrateur mis à jour pour ${email}`, "init");
    }
    await storage.updateUser(existing.id, updates);
    log(`Compte administrateur existant confirmé: ${email}`, "init");
    return existing;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);
  const admin = await storage.createUser({
    fullName: name,
    email,
    phone,
    password: hashedPassword,
    role: "admin",
    isVerified: true,
  });

  log(`Compte administrateur créé: ${email}`, "init");

  if (isFirst) {
    const existingCommission = await storage.getCommissionSettings();
    if (!existingCommission) {
      await storage.updateCommissionSettings("7.00", "7.00", admin.id);
      log("Paramètres de commission initialisés (7%)", "init");
    }
    await storage.initializeSocialLinks();
    log("Liens réseaux sociaux initialisés", "init");
  }

  return admin;
}

export async function initializeAdminAccount() {
  try {
    await ensureAdminAccount(ADMIN_EMAIL_1, ADMIN_PHONE_1, "Admin SendavaPay", true);
    await ensureAdminAccount(ADMIN_EMAIL_2, ADMIN_PHONE_2, "Admin Felidolayi", false);
    log("Comptes administrateurs initialisés", "init");
  } catch (error) {
    log(`Erreur lors de l'initialisation admin: ${error}`, "init");
    throw error;
  }
}
