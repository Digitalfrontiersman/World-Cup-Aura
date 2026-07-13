import { Router, type IRouter } from "express";
import { db, shipOrdersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createPaymentIntent, getPaymentIntent, isZiinaConfigured } from "../lib/ziina";

const router: IRouter = Router();

// Shipping price: ~$4.99 charged in AED fils (Ziina is AED-only). Configurable.
const SHIP_AMOUNT_FILS = Number(process.env.ZIINA_SHIP_AMOUNT_FILS) || 1833;

interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

function isValidAddress(a: unknown): a is ShippingAddress {
  const x = a as Partial<ShippingAddress> | null;
  return Boolean(
    x &&
      typeof x.fullName === "string" && x.fullName.trim() &&
      typeof x.line1 === "string" && x.line1.trim() &&
      typeof x.city === "string" && x.city.trim() &&
      typeof x.country === "string" && x.country.trim(),
  );
}

/** Start a physical-card shipping order: create a pending order + Ziina checkout. */
router.post("/aura/ship", async (req, res): Promise<void> => {
  if (!isZiinaConfigured()) {
    res.status(503).json({ error: "Payments are not configured on the server." });
    return;
  }
  const { cardSlug, cardName, email, shipping, origin } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ error: "A valid email is required." });
    return;
  }
  if (!isValidAddress(shipping)) {
    res.status(400).json({ error: "A complete shipping address is required." });
    return;
  }
  const base = typeof origin === "string" && /^https?:\/\//.test(origin) ? origin.replace(/\/+$/, "") : "";
  if (!base) {
    res.status(400).json({ error: "Invalid return origin." });
    return;
  }

  const s = shipping;
  try {
    // The order is captured in the Ziina payment metadata (fulfillment source of
    // truth), so checkout works even before the ship_orders table is migrated.
    const pi = await createPaymentIntent({
      amountFils: SHIP_AMOUNT_FILS,
      successUrl: `${base}/?ship=success&pi={PAYMENT_INTENT_ID}`,
      cancelUrl: `${base}/?ship=cancelled`,
      message: `Aura Card shipping${typeof cardName === "string" ? ` - ${cardName}` : ""}`,
      metadata: {
        type: "aura_card_shipping",
        card_slug: typeof cardSlug === "string" ? cardSlug : "",
        card_name: typeof cardName === "string" ? cardName : "",
        email,
        ship_name: s.fullName,
        ship_line1: s.line1,
        ship_line2: s.line2 ?? "",
        ship_city: s.city,
        ship_region: s.region ?? "",
        ship_postal: s.postalCode ?? "",
        ship_country: s.country,
        ship_phone: s.phone ?? "",
      },
    });
    if (!pi.redirect_url) {
      res.status(502).json({ error: "No checkout URL was returned." });
      return;
    }

    // Best-effort DB persistence: never let a missing table break checkout.
    try {
      await db.insert(shipOrdersTable).values({
        cardSlug: typeof cardSlug === "string" ? cardSlug : null,
        cardName: typeof cardName === "string" ? cardName : null,
        status: "pending",
        paymentIntentId: pi.id,
        amountFils: SHIP_AMOUNT_FILS,
        currency: "AED",
        email,
        shipping: s,
      });
    } catch (dbErr) {
      req.log?.warn({ err: dbErr, event: "ship_order_persist_skipped" }, "ship_orders persist skipped (table missing?); order captured in Ziina metadata");
    }

    res.json({ redirectUrl: pi.redirect_url, paymentIntentId: pi.id });
  } catch (err) {
    req.log?.error({ err, event: "ziina_create_failed" }, "Ziina payment intent failed");
    res.status(502).json({ error: "Could not start checkout." });
  }
});

/** Poll a payment's status (called by the app after returning from checkout). */
router.get("/aura/ship/:paymentIntentId/status", async (req, res): Promise<void> => {
  if (!isZiinaConfigured()) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }
  try {
    const pi = await getPaymentIntent(req.params.paymentIntentId);
    const paid = pi.status === "completed";
    if (paid || pi.status === "failed") {
      try {
        await db.update(shipOrdersTable).set({ status: paid ? "paid" : "failed" }).where(eq(shipOrdersTable.paymentIntentId, pi.id));
      } catch { /* table may not exist yet; status still returned from Ziina */ }
    }
    res.json({ status: pi.status, paid });
  } catch (err) {
    req.log?.error({ err, event: "ziina_status_failed" }, "Ziina status check failed");
    res.status(502).json({ error: "Could not check payment status." });
  }
});

export default router;
