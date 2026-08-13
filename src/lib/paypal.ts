// Minimal PayPal REST (v2) client — no SDK needed, just fetch. Uses
// PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET (from developer.paypal.com) and
// PAYPAL_ENV ("sandbox" | "live", defaults to sandbox so nothing charges for
// real until you deliberately switch it).
import { PAYMENT_CURRENCY, toMinorUnits } from "./stripe";

function paypalBase() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET is not configured");
  }

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PayPal auth failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/** Creates a PayPal order for one pending booking. referenceId ties the
 *  order back to the pendingBookings/{id} doc on capture. */
export async function createPaypalOrder(amountPkr: number, referenceId: string) {
  const token = await getAccessToken();
  // PayPal's Orders API wants a decimal string, not minor units.
  const value = (toMinorUnits(amountPkr) / 100).toFixed(2);

  const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          amount: { currency_code: PAYMENT_CURRENCY.toUpperCase(), value },
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PayPal order creation failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  return data.id as string;
}

/** Captures a previously-created order. Returns the reference_id supplied at
 *  creation time plus the transaction id, so the caller can finalize the
 *  matching pending booking. */
export async function capturePaypalOrder(orderId: string) {
  const token = await getAccessToken();

  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PayPal capture failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];

  return {
    status: data.status as string, // "COMPLETED" on success
    referenceId: unit?.reference_id as string | undefined,
    transactionId: capture?.id as string | undefined,
  };
}

/** Refunds a completed PayPal capture by its capture id (what we store as an
 *  appointment's paymentReference for the "paypal" provider). Full refund —
 *  no amount passed means PayPal refunds the entire captured amount. */
export async function refundPaypalCapture(captureId: string) {
  const token = await getAccessToken();

  const res = await fetch(`${paypalBase()}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PayPal refund failed: ${res.status} ${detail}`);
  }

  return res.json();
}
