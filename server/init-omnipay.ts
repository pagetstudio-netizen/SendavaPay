import { storage } from "./storage";

function log(msg: string, tag = "omnipay-init") {
  console.log(`[${new Date().toISOString()}] [${tag}] ${msg}`);
}

const OMNIPAY_SERVICES = [
  { code: "57", name: "Orange Money", country: "Sénégal", countryCode: "SN", currency: "XOF", paymentGateway: "omnipay" },
  { code: "58", name: "Wave", country: "Sénégal", countryCode: "SN", currency: "XOF", paymentGateway: "omnipay" },
  { code: "59", name: "Mixx", country: "Sénégal", countryCode: "SN", currency: "XOF", paymentGateway: "omnipay" },
  { code: "60", name: "Orange Money", country: "Mali", countryCode: "ML", currency: "XOF", paymentGateway: "omnipay" },
];

const OMNIPAY_COUNTRIES = [
  { code: "SN", name: "Sénégal", currency: "XOF", flag: "🇸🇳" },
  { code: "ML", name: "Mali", currency: "XOF", flag: "🇲🇱" },
];

export async function initializeOmnipayServices(): Promise<void> {
  try {
    const existingCountries = await storage.getCountries();
    const existingOperators = await storage.getOperators();
    const existingCodes = new Set(existingOperators.map(op => op.code));

    const countryIdMap: Record<string, number> = {};

    for (const c of existingCountries) {
      countryIdMap[c.code] = c.id;
    }

    for (const country of OMNIPAY_COUNTRIES) {
      if (!countryIdMap[country.code]) {
        const created = await storage.createCountry({
          code: country.code,
          name: country.name,
          currency: country.currency,
          isActive: true,
        } as any);
        countryIdMap[country.code] = created.id;
        log(`Pays créé automatiquement: ${country.name} (${country.code})`, "omnipay-init");
      }
    }

    for (const svc of OMNIPAY_SERVICES) {
      if (!existingCodes.has(svc.code)) {
        const countryId = countryIdMap[svc.countryCode];
        if (!countryId) {
          log(`Pays introuvable pour le service ${svc.code} (${svc.countryCode})`, "omnipay-init");
          continue;
        }
        await storage.createOperator({
          code: svc.code,
          name: svc.name,
          countryId,
          type: "mobile_money",
          dailyLimit: "5000000",
          paymentGateway: svc.paymentGateway,
          isActive: true,
          inMaintenance: false,
        } as any);
        log(`Opérateur OmniPay créé automatiquement: ${svc.name} (code=${svc.code}, ${svc.country})`, "omnipay-init");
      }
    }

    log("Initialisation des services OmniPay terminée", "omnipay-init");
  } catch (err: any) {
    log(`Erreur lors de l'initialisation des services OmniPay: ${err.message}`, "omnipay-init");
  }
}
