/**
 * PayDunya SoftPay Operator Map
 * Source: https://developers.paydunya.com/doc/FR/softpay
 *
 * Each entry defines:
 *  - slug         : URL slug for /api/v1/softpay/{slug}
 *  - countryCode  : ISO 2-letter country code
 *  - currency     : XOF | XAF
 *  - responseType : "direct" (USSD push) | "redirect" (URL returned) | "qr" (QR + OM URL)
 *  - requiresOtp  : operator needs a one-time code (Orange CI, Orange BF)
 *  - buildPayload : returns the operator-specific POST body
 */

export type SoftPayResponseType = "direct" | "redirect" | "qr";

export interface SoftPayOperatorDef {
  slug: string;
  countryCode: string;
  currency: "XOF" | "XAF";
  responseType: SoftPayResponseType;
  requiresOtp: boolean;
  buildPayload: (p: SoftPayPayloadParams) => Record<string, string>;
}

export interface SoftPayPayloadParams {
  phone: string;
  name: string;
  email: string;
  token: string;
  otp?: string;
  address?: string;
}

// ─── Operator definitions ──────────────────────────────────────────────────────

const OPERATORS: SoftPayOperatorDef[] = [
  // ── Sénégal ────────────────────────────────────────────────────────────────
  {
    slug: "new-orange-money-senegal",
    countryCode: "SN",
    currency: "XOF",
    responseType: "qr",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      customer_name: name,
      customer_email: email,
      phone_number: phone,
      invoice_token: token,
    }),
  },
  {
    slug: "free-money-senegal",
    countryCode: "SN",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      customer_name: name,
      customer_email: email,
      phone_number: phone,
      payment_token: token,
    }),
  },
  {
    slug: "expresso-senegal",
    countryCode: "SN",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      expresso_sn_fullName: name,
      expresso_sn_email: email,
      expresso_sn_phone: phone,
      payment_token: token,
    }),
  },
  {
    slug: "wave-senegal",
    countryCode: "SN",
    currency: "XOF",
    responseType: "redirect",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      wave_senegal_fullName: name,
      wave_senegal_email: email,
      wave_senegal_phone: phone,
      wave_senegal_payment_token: token,
    }),
  },
  {
    slug: "wizall-money-senegal",
    countryCode: "SN",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      customer_name: name,
      customer_email: email,
      phone_number: phone,
      invoice_token: token,
    }),
  },
  // ── Côte d'Ivoire ──────────────────────────────────────────────────────────
  {
    slug: "orange-money-ci",
    countryCode: "CI",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: true,
    buildPayload: ({ phone, name, email, token, otp }) => ({
      orange_money_ci_customer_fullname: name,
      orange_money_ci_email: email,
      orange_money_ci_phone_number: phone,
      orange_money_ci_otp: otp || "",
      payment_token: token,
    }),
  },
  {
    slug: "mtn-ci",
    countryCode: "CI",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      mtn_ci_customer_fullname: name,
      mtn_ci_email: email,
      mtn_ci_phone_number: phone,
      mtn_ci_wallet_provider: "MTNCI",
      payment_token: token,
    }),
  },
  {
    slug: "moov-ci",
    countryCode: "CI",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      moov_ci_customer_fullname: name,
      moov_ci_email: email,
      moov_ci_phone_number: phone,
      payment_token: token,
    }),
  },
  {
    slug: "wave-ci",
    countryCode: "CI",
    currency: "XOF",
    responseType: "redirect",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      wave_ci_fullName: name,
      wave_ci_email: email,
      wave_ci_phone: phone,
      wave_ci_payment_token: token,
    }),
  },
  // ── Burkina Faso ───────────────────────────────────────────────────────────
  {
    slug: "orange-money-burkina",
    countryCode: "BF",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: true,
    buildPayload: ({ phone, name, email, token, otp }) => ({
      name_bf: name,
      email_bf: email,
      phone_bf: phone,
      otp_code: otp || "",
      payment_token: token,
    }),
  },
  {
    slug: "moov-burkina",
    countryCode: "BF",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      moov_burkina_faso_fullName: name,
      moov_burkina_faso_email: email,
      moov_burkina_faso_phone_number: phone,
      moov_burkina_faso_payment_token: token,
    }),
  },
  // ── Bénin ─────────────────────────────────────────────────────────────────
  {
    slug: "moov-benin",
    countryCode: "BJ",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      moov_benin_customer_fullname: name,
      moov_benin_email: email,
      moov_benin_phone_number: phone,
      payment_token: token,
    }),
  },
  {
    slug: "mtn-benin",
    countryCode: "BJ",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      mtn_benin_customer_fullname: name,
      mtn_benin_email: email,
      mtn_benin_phone_number: phone,
      mtn_benin_wallet_provider: "MTNBENIN",
      payment_token: token,
    }),
  },
  // ── Togo ──────────────────────────────────────────────────────────────────
  {
    slug: "t-money-togo",
    countryCode: "TG",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      name_t_money: name,
      email_t_money: email,
      phone_t_money: phone,
      payment_token: token,
    }),
  },
  {
    slug: "moov-togo",
    countryCode: "TG",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token, address }) => ({
      moov_togo_customer_fullname: name,
      moov_togo_email: email,
      moov_togo_customer_address: address || "Lomé",
      moov_togo_phone_number: phone,
      payment_token: token,
    }),
  },
  // ── Mali ──────────────────────────────────────────────────────────────────
  {
    slug: "orange-money-mali",
    countryCode: "ML",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token, address }) => ({
      orange_money_mali_customer_fullname: name,
      orange_money_mali_email: email,
      orange_money_mali_phone_number: phone,
      orange_money_mali_customer_address: address || "Bamako",
      payment_token: token,
    }),
  },
  {
    slug: "moov-mali",
    countryCode: "ML",
    currency: "XOF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token, address }) => ({
      moov_ml_customer_fullname: name,
      moov_ml_email: email,
      moov_ml_phone_number: phone,
      moov_ml_customer_address: address || "Bamako",
      payment_token: token,
    }),
  },
  // ── Cameroun ──────────────────────────────────────────────────────────────
  {
    slug: "mtn-cameroun",
    countryCode: "CM",
    currency: "XAF",
    responseType: "direct",
    requiresOtp: false,
    buildPayload: ({ phone, name, email, token }) => ({
      mtn_cameroun_customer_fullname: name,
      mtn_cameroun_email: email,
      mtn_cameroun_phone_number: phone,
      mtn_cameroun_wallet_provider: "MTNCAMEROUN",
      payment_token: token,
    }),
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Find operator by slug */
export function getSoftPayOperatorBySlug(slug: string): SoftPayOperatorDef | null {
  return OPERATORS.find(op => op.slug === slug) || null;
}

/** Map operator name + country → slug */
const SLUG_MAP: Record<string, string> = {
  // Orange Money
  "orange sn": "new-orange-money-senegal",
  "orange money sn": "new-orange-money-senegal",
  "orange money senegal": "new-orange-money-senegal",
  "orange money ci": "orange-money-ci",
  "orange ci": "orange-money-ci",
  "orange money ml": "orange-money-mali",
  "orange money mali": "orange-money-mali",
  "orange money bf": "orange-money-burkina",
  "orange money burkina": "orange-money-burkina",
  // MTN
  "mtn ci": "mtn-ci",
  "mtn bj": "mtn-benin",
  "mtn benin": "mtn-benin",
  "mtn cm": "mtn-cameroun",
  "mtn cameroun": "mtn-cameroun",
  // Moov
  "moov ci": "moov-ci",
  "moov bj": "moov-benin",
  "moov benin": "moov-benin",
  "moov tg": "moov-togo",
  "moov togo": "moov-togo",
  "moov bf": "moov-burkina",
  "moov burkina": "moov-burkina",
  "moov ml": "moov-mali",
  "moov mali": "moov-mali",
  // Wave
  "wave sn": "wave-senegal",
  "wave senegal": "wave-senegal",
  "wave ci": "wave-ci",
  // Others
  "free money": "free-money-senegal",
  "free money sn": "free-money-senegal",
  "free sn": "free-money-senegal",
  "expresso": "expresso-senegal",
  "expresso sn": "expresso-senegal",
  "wizall": "wizall-money-senegal",
  "wizall sn": "wizall-money-senegal",
  "t-money": "t-money-togo",
  "t money": "t-money-togo",
  "tmoney": "t-money-togo",
  "t-money tg": "t-money-togo",
};

export function getSoftPaySlug(operatorName: string, countryCode: string): string | null {
  const name = operatorName.trim().toLowerCase();
  const cc = countryCode.trim().toLowerCase();

  // Try "name cc" first
  const key1 = `${name} ${cc}`;
  if (SLUG_MAP[key1]) return SLUG_MAP[key1];

  // Try name alone
  if (SLUG_MAP[name]) return SLUG_MAP[name];

  // Pattern-based fallback
  if (name.includes("orange")) {
    if (cc === "sn") return "new-orange-money-senegal";
    if (cc === "ci") return "orange-money-ci";
    if (cc === "ml") return "orange-money-mali";
    if (cc === "bf") return "orange-money-burkina";
  }
  if (name.includes("mtn")) {
    if (cc === "ci") return "mtn-ci";
    if (cc === "bj") return "mtn-benin";
    if (cc === "cm") return "mtn-cameroun";
  }
  if (name.includes("moov")) {
    if (cc === "ci") return "moov-ci";
    if (cc === "bj") return "moov-benin";
    if (cc === "tg") return "moov-togo";
    if (cc === "bf") return "moov-burkina";
    if (cc === "ml") return "moov-mali";
  }
  if (name.includes("wave")) {
    if (cc === "sn") return "wave-senegal";
    if (cc === "ci") return "wave-ci";
  }
  if (name.includes("free")) return "free-money-senegal";
  if (name.includes("expresso")) return "expresso-senegal";
  if (name.includes("wizall")) return "wizall-money-senegal";
  if (name.includes("t-money") || name === "tmoney") return "t-money-togo";

  return null;
}

export function getSoftPayOperator(operatorName: string, countryCode: string): SoftPayOperatorDef | null {
  const slug = getSoftPaySlug(operatorName, countryCode);
  if (!slug) return null;
  return getSoftPayOperatorBySlug(slug);
}

export { OPERATORS as SOFTPAY_OPERATORS };
