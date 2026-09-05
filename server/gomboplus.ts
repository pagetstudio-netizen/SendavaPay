import { getCredential } from "./credentials";
import { readFileSync } from "fs";

const GOMBOPLUS_API_URL = "https://api.gomboplus.com";
const REQUEST_TIMEOUT_MS = 20_000;

const COUNTRY_PREFIXES: Record<string, string> = {
  TG: "228",
  BJ: "229",
  BN: "229",
  BF: "226",
};

const COUNTRY_CODES: Record<string, string> = {
  TG: "TG",
  BJ: "BN",
  BN: "BN",
  BF: "BF",
};

const OPERATOR_CODES: Record<string, Record<string, string>> = {
  TG: {
    yas: "yas",
    tmoney: "yas",
    "t-money": "yas",
    moov: "moov",
  },
  BJ: {
    mtn: "mtn",
    moov: "moov",
  },
  BN: {
    mtn: "mtn",
    moov: "moov",
  },
  BF: {
    moov: "moov",
    orange: "om",
    "orange money": "om",
  },
};

export type GomboTransactionStatus = "SUCCESS" | "PENDING" | "FAILED";

export interface GomboPlusTransactionParams {
  amount: number;
  phoneNumber: string;
  countryCode: string;
  operator: string;
  callbackUrl: string;
  reference?: string;
}

export interface GomboPlusResult {
  accepted: boolean;
  reference: string | null;
  status: GomboTransactionStatus;
  message: string;
  raw: any;
}

export interface GomboPlusStatusResult {
  reference: string | null;
  status: GomboTransactionStatus;
  message: string;
  amount?: number;
  raw: any;
}

export class GomboPlusConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GomboPlusConfigurationError";
  }
}

function getKeys(): { publicKey: string; privateKey: string } {
  let publicKey = getCredential("GOMBOPLUS_PUBLIC_KEY").trim();
  if (!publicKey) {
    const publicKeyPath = getCredential("GOMBOPLUS_PUBLIC_KEY_PATH").trim();
    if (publicKeyPath) {
      try {
        publicKey = readFileSync(publicKeyPath, "utf8").trim();
      } catch {
        throw new GomboPlusConfigurationError(
          `Impossible de lire le fichier GomboPlus indiqué par GOMBOPLUS_PUBLIC_KEY_PATH: ${publicKeyPath}`,
        );
      }
    }
  }
  const privateKey = getCredential("GOMBOPLUS_PRIVATE_KEY").trim();
  if (!publicKey || !privateKey) {
    throw new GomboPlusConfigurationError(
      "GomboPlus n'est pas configuré. Les secrets GOMBOPLUS_PUBLIC_KEY et GOMBOPLUS_PRIVATE_KEY sont requis.",
    );
  }
  return { publicKey, privateKey };
}

function normalizeCountry(countryCode: string): string {
  const normalized = String(countryCode || "").trim().toUpperCase();
  const result = COUNTRY_CODES[normalized];
  if (!result) {
    throw new Error(`Pays non supporté par GomboPlus: ${countryCode}`);
  }
  return result;
}

function normalizeOperator(operator: string, countryCode: string): string {
  const country = String(countryCode || "").trim().toUpperCase();
  const normalized = String(operator || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const aliases: Record<string, string> = {
    yas: "yas",
    tmoney: "tmoney",
    "t-money": "t-money",
    "t money": "t-money",
    moov: "moov",
    "moov money": "moov",
    mtn: "mtn",
    "mtn money": "mtn",
    orange: "orange",
    "orange money": "orange money",
  };
  const alias = aliases[normalized] || normalized;
  const result = OPERATOR_CODES[country]?.[alias];
  if (!result) {
    throw new Error(`Opérateur '${operator}' non supporté par GomboPlus au ${country}`);
  }
  return result;
}

export function formatPhoneForGomboPlus(phone: string, countryCode: string): string {
  const country = String(countryCode || "").trim().toUpperCase();
  const prefix = COUNTRY_PREFIXES[country];
  if (!prefix) throw new Error(`Pays non supporté par GomboPlus: ${countryCode}`);

  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(prefix)) digits = digits.slice(prefix.length);

  // GomboPlus expects the local subscriber number, without + or country prefix.
  // Strip only a redundant trunk zero for the 8-digit TG/BF formats.
  if ((country === "TG" || country === "BF") && digits.length > 8 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (!digits || digits.length < 8) {
    throw new Error("Numéro de téléphone invalide pour GomboPlus");
  }
  return digits;
}

function statusFromValue(value: unknown): GomboTransactionStatus {
  const status = String(value || "").trim().toLowerCase();
  if (["success", "successful", "completed", "complete", "succeeded", "paid", "done"].includes(status)) {
    return "SUCCESS";
  }
  if (["failed", "failure", "rejected", "refused", "cancelled", "canceled", "error", "declined"].includes(status)) {
    return "FAILED";
  }
  return "PENDING";
}

function extractContent(raw: any): any {
  return raw?.content && typeof raw.content === "object" ? raw.content : raw;
}

function extractReference(raw: any): string | null {
  const content = extractContent(raw);
  const reference = content?.reference ?? content?.transaction_reference ?? raw?.reference ?? raw?.transaction_reference;
  return reference == null ? null : String(reference);
}

function extractMessage(raw: any): string {
  const content = extractContent(raw);
  const message = content?.status_message ?? content?.message ?? raw?.status_message ?? raw?.message ?? raw?.detail;
  if (typeof message === "string" && message.trim()) return message.trim();
  return "Réponse GomboPlus sans message";
}

function extractStatus(raw: any): GomboTransactionStatus {
  const content = extractContent(raw);
  return statusFromValue(content?.status ?? content?.transaction_status ?? raw?.status ?? raw?.transaction_status);
}

async function gomboRequest(path: string, method: "GET" | "POST", body?: Record<string, unknown>): Promise<{ response: Response; data: any }> {
  const { publicKey, privateKey } = getKeys();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${GOMBOPLUS_API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Public-Key": publicKey,
        "X-Private-Key": privateKey,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: "Réponse JSON invalide de GomboPlus", raw: text.slice(0, 500) };
    }
    return { response, data };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Délai dépassé lors de la communication avec GomboPlus");
    }
    throw new Error("Impossible de contacter GomboPlus");
  } finally {
    clearTimeout(timeout);
  }
}

function makeResult(response: Response, data: any): GomboPlusResult {
  const status = extractStatus(data);
  const reference = extractReference(data);
  const accepted = response.status === 202 && !!reference && status !== "FAILED";
  return {
    accepted,
    reference,
    status: accepted ? "PENDING" : status,
    message: accepted ? extractMessage(data) : (extractMessage(data) || `GomboPlus HTTP ${response.status}`),
    raw: data,
  };
}

export async function gomboPlusPayin(params: GomboPlusTransactionParams): Promise<GomboPlusResult> {
  const country = normalizeCountry(params.countryCode);
  const operator = normalizeOperator(params.operator, params.countryCode);
  const recipientNumber = formatPhoneForGomboPlus(params.phoneNumber, params.countryCode);
  const { response, data } = await gomboRequest("/api/mobile-services/mobile-deposit/", "POST", {
    amount: params.amount,
    number: recipientNumber,
    country,
    operator,
    callback_url: params.callbackUrl,
    ...(params.reference ? { reference: params.reference } : {}),
  });
  return makeResult(response, data);
}

export async function gomboPlusPayout(params: GomboPlusTransactionParams): Promise<GomboPlusResult> {
  const country = normalizeCountry(params.countryCode);
  const operator = normalizeOperator(params.operator, params.countryCode);
  const recipientNumber = formatPhoneForGomboPlus(params.phoneNumber, params.countryCode);
  const { response, data } = await gomboRequest("/api/mobile-services/mobile-withdrawal/", "POST", {
    amount: params.amount,
    number: recipientNumber,
    country,
    operator,
    callback_url: params.callbackUrl,
    ...(params.reference ? { reference: params.reference } : {}),
  });
  return makeResult(response, data);
}

export async function gomboPlusCheckStatus(reference: string): Promise<GomboPlusStatusResult> {
  if (!reference.trim()) throw new Error("Référence GomboPlus manquante");
  const { response, data } = await gomboRequest("/api/mobile-services/check-transaction-status/", "POST", {
    transaction_reference: reference,
  });
  if (!response.ok) {
    return {
      reference,
      status: "PENDING",
      message: extractMessage(data) || `GomboPlus HTTP ${response.status}`,
      raw: data,
    };
  }
  const content = extractContent(data);
  const amountValue = content?.amount ?? data?.amount;
  const amount = amountValue == null ? undefined : Number(amountValue);
  return {
    reference: extractReference(data) || reference,
    status: extractStatus(data),
    message: extractMessage(data),
    ...(Number.isFinite(amount) ? { amount } : {}),
    raw: data,
  };
}

export async function gomboPlusGetBalance(): Promise<{ balance: number; currency?: string; raw: any }> {
  const { response, data } = await gomboRequest("/api/wallets/get-balance/", "GET");
  if (!response.ok) {
    throw new Error(extractMessage(data) || `GomboPlus HTTP ${response.status}`);
  }
  const content = extractContent(data);
  const value = content?.balance ?? content?.available_balance ?? data?.balance ?? data?.available_balance;
  const balance = Number(value);
  if (!Number.isFinite(balance)) throw new Error("Solde GomboPlus absent de la réponse");
  return { balance, currency: content?.currency ?? data?.currency, raw: data };
}