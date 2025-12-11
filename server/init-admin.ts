import { storage } from "./storage";
import bcrypt from "bcrypt";
import { log } from "./index";

const ADMIN_EMAIL = "pagetstudio@gmail.com";
const ADMIN_PHONE = "+228 99935673";
const ADMIN_PASSWORD = "AAbb11##";
const ADMIN_NAME = "Admin SendavaPay";

export async function initializeAdminAccount() {
  try {
    const existingAdmin = await storage.getUserByEmail(ADMIN_EMAIL);
    
    if (existingAdmin) {
      log("Compte administrateur existe déjà", "init");
      
      if (existingAdmin.role !== "admin") {
        await storage.updateUser(existingAdmin.id, { role: "admin" });
        log("Rôle administrateur mis à jour", "init");
      }
      
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await storage.updateUser(existingAdmin.id, { 
        password: hashedPassword,
        isVerified: true 
      });
      log("Mot de passe administrateur réinitialisé", "init");
      
      return existingAdmin;
    }
    
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    const admin = await storage.createUser({
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });
    
    log("Compte administrateur créé avec succès", "init");
    log(`Email: ${ADMIN_EMAIL}`, "init");
    log(`Téléphone: ${ADMIN_PHONE}`, "init");
    
    const existingCommission = await storage.getCommissionSettings();
    if (!existingCommission) {
      await storage.createCommissionSettings({
        depositRate: "7.00",
        withdrawalRate: "7.00",
        transferRate: "0.00",
        minDeposit: "100",
        minWithdrawal: "500",
        minTransfer: "100",
      });
      log("Paramètres de commission initialisés (7%)", "init");
    }
    
    return admin;
  } catch (error) {
    log(`Erreur lors de l'initialisation admin: ${error}`, "init");
    throw error;
  }
}
