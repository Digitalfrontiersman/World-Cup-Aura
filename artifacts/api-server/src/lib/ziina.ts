// Ziina payment gateway client (hosted checkout via Payment Intents).
// Docs: https://docs.ziina.com/api-reference/payment-intent
//
// Ziina charges in AED, amount in fils (1 AED = 100 fils). We display "$4.99"
// but charge the AED equivalent (configurable). Test mode issues a real hosted
// page you can complete with any test card - no money moves.

const ZIINA_BASE = "https://api-v2.ziina.com/api";
const API_KEY = process.env.ZIINA_API_KEY?.trim() ?? "";
// Default to test mode; set ZIINA_TEST_MODE=false to take real payments.
const TEST_MODE = process.env.ZIINA_TEST_MODE !== "false";

export function isZiinaConfigured(): boolean {
  return API_KEY.length > 0;
}

export interface CreatePaymentIntentParams {
  amountFils: number;
  successUrl: string;
  cancelUrl: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ZiinaPaymentIntent {
  id: string;
  redirect_url?: string;
  status: string;
  latest_error?: unknown;
}

export async function createPaymentIntent(p: CreatePaymentIntentParams): Promise<ZiinaPaymentIntent> {
  const res = await fetch(`${ZIINA_BASE}/payment_intent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: p.amountFils,
      currency_code: "AED",
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
      test: TEST_MODE,
      ...(p.message ? { message: p.message } : {}),
      ...(p.metadata ? { metadata: p.metadata } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Ziina create payment_intent ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
  return (await res.json()) as ZiinaPaymentIntent;
}

export async function getPaymentIntent(id: string): Promise<ZiinaPaymentIntent> {
  const res = await fetch(`${ZIINA_BASE}/payment_intent/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`Ziina get payment_intent ${res.status}`);
  return (await res.json()) as ZiinaPaymentIntent;
}
