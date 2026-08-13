"use client";

import { useEffect, useRef } from "react";
import { authedFetch } from "@/lib/authed-fetch";

type BookingPayload = {
  patientName?: string;
  patientPhone: string;
  service: string;
  mode: string;
  date: string;
  time: string;
  notes: string;
  amount: number;
} | null;

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => { render: (el: HTMLElement) => void };
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;

function loadPaypalSdk(clientId: string, currency: string): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load PayPal"));
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
}

export default function PaypalButton({
  amount,
  booking,
  disabled,
  onBusy,
  onSuccess,
  onError,
}: {
  amount: number;
  booking: BookingPayload;
  disabled?: boolean;
  onBusy: (busy: boolean) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const currency = (process.env.NEXT_PUBLIC_PAYMENT_CURRENCY || "USD").toUpperCase();

    if (!clientId || !containerRef.current || rendered.current || !booking) return;

    loadPaypalSdk(clientId, currency)
      .then(() => {
        if (!window.paypal || !containerRef.current || rendered.current) return;
        rendered.current = true;

        window.paypal
          .Buttons({
            style: { layout: "horizontal", height: 44, label: "paypal" },
            createOrder: async () => {
              onBusy(true);
              const res = await authedFetch("/api/payments/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(booking),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error ?? "Could not start PayPal checkout");
              return data.orderId;
            },
            onApprove: async (data: { orderID: string }) => {
              const res = await authedFetch("/api/payments/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID }),
              });
              const result = await res.json();
              onBusy(false);
              if (!res.ok) {
                onError(result.error ?? "Payment could not be completed");
                return;
              }
              onSuccess();
            },
            onError: () => {
              onBusy(false);
              onError("PayPal payment failed. Please try again.");
            },
            onCancel: () => onBusy(false),
          })
          .render(containerRef.current);
      })
      .catch(() => onError("Could not load PayPal. Please try the card option instead."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) return null;

  return (
    <div
      ref={containerRef}
      aria-disabled={disabled}
      className={disabled ? "pointer-events-none opacity-60" : undefined}
      data-amount={amount}
    />
  );
}
