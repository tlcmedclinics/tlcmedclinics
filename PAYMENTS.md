# Payments — how to get the credentials and where to put them

Three gateways are wired up: **JazzCash**, **EasyPaisa** and **Safepay** (cards).
Each one appears on the booking page only when its credentials are set, so you
can switch them on one at a time as each account is approved. Nothing needs to
be deployed again to add one — set the variables, restart, done.

Stripe and PayPal have been removed from the booking page. Neither company
onboards a merchant registered in Pakistan, so those two buttons could never
have taken a payment into a Pakistani bank account.

---

## 1. Environment variables

Put these in `.env.local` for your own machine, and in **Hostinger → your site →
Environment / .env** for the live site. They are secret: never commit them, and
never give any of them a `NEXT_PUBLIC_` prefix — that would publish them in the
JavaScript every visitor downloads.

```dotenv
# sandbox until you have tested everything end to end. Change to "live" last.
PAYMENTS_MODE=sandbox

# --- JazzCash ---
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=

# --- EasyPaisa ---
EASYPAISA_STORE_ID=
EASYPAISA_HASH_KEY=

# --- Safepay (cards) ---
SAFEPAY_API_KEY=
SAFEPAY_SECRET_KEY=

# Already needed by the rest of the app — the gateways build their return URL
# from it, so a wrong value sends paying patients to a page that doesn't exist.
NEXT_PUBLIC_SITE_URL=https://tlcmedclinics.com
```

`PAYMENTS_MODE` is the only switch between test and real money. It defaults to
sandbox, so forgetting it is safe in the direction that matters.

---

## 2. Where each account comes from

### JazzCash

1. Go to **https://sandbox.jazzcash.com.pk** and register a sandbox merchant.
   This is free and instant, and gives you working test credentials the same day.
2. On the sandbox dashboard, open **Profile → Integration / API keys**. You get
   three values:
   - Merchant ID → `JAZZCASH_MERCHANT_ID`
   - Password → `JAZZCASH_PASSWORD`
   - Integrity Salt (sometimes called *Integration Salt* or *Hash Key*) →
     `JAZZCASH_INTEGRITY_SALT`
3. For the real account: apply for a **JazzCash Merchant Account** at
   https://www.jazzcash.com.pk/business — or by walking into a Jazz Business
   Centre, which in practice is faster. They will ask for the clinic's NTN,
   bank account details, CNIC of the owner, and proof of business (the clinic's
   registration / practice licence).
4. Once approved you are issued a **second, different** set of the same three
   values for production. Swap them in and set `PAYMENTS_MODE=live`.

Settlement is usually T+2 into the bank account you register.

### EasyPaisa

1. Apply for an **Easypaisa Merchant / Easypay** account through
   https://easypaisa.com.pk (Business → Merchant Services), or through a Telenor
   Sales & Service Centre. Same documents as JazzCash.
2. They send you an **integration guide PDF** and two values:
   - Store ID → `EASYPAISA_STORE_ID`
   - Hash Key → `EASYPAISA_HASH_KEY`
3. The hash key is either 16 or 32 characters. The code detects which and picks
   the matching cipher, so either is fine — just paste it exactly, including any
   trailing characters.

**One thing to raise with them when you apply:** ask to have the
**server-to-server IPN** (instant payment notification) switched on for your
store. Read `src/lib/gateways/easypaisa.ts` — the note above `verifyCallback`
explains why. EasyPaisa's browser callback is unsigned, which means a
technically-minded patient could in principle confirm a booking without paying.
The current code limits the damage but does not close the hole; the signed IPN
does. Do not go live on EasyPaisa for large amounts until this is sorted.

### Safepay (cards)

1. Sign up at **https://getsafepay.pk**. Sandbox access is immediate.
2. Sandbox dashboard: https://sandbox.api.getsafepay.com/dashboard/login →
   **Developers → API keys**. You get a public key (`sec_…`) and a secret key.
   - public key → `SAFEPAY_API_KEY`
   - secret key → `SAFEPAY_SECRET_KEY`
3. For live: complete Safepay's onboarding (NTN, bank account, business
   documents, and they will ask for the website to have **Terms of Service**,
   **Privacy Policy** and **Refund/Cancellation Policy** pages). Live dashboard
   is at https://getsafepay.com/dashboard/login, and the live keys are under the
   same Developers section.

> **Those three policy pages do not exist on the site yet.** Safepay and the
> wallet gateways all check for them during approval, so they are worth writing
> before you apply, not after they ask.

---

## 3. Testing, in this order

1. Set `PAYMENTS_MODE=sandbox` and fill in whichever gateway you have.
2. `npm run dev`, book an appointment, and check the payment step now lists the
   gateways you configured.
3. Pay with the gateway's test wallet / test card (each dashboard lists its own
   test credentials).
4. Check three things afterwards:
   - the appointment shows as **confirmed and paid** in the patient dashboard;
   - the slot is gone from the booking calendar;
   - a `paymentAttempts` document exists in Firestore with `status: "completed"`.
5. Then test **failure**: cancel on the gateway's page. The slot must come back,
   and you must land on "Payment not completed".

Only after both paths work, set `PAYMENTS_MODE=live` with the production
credentials.

---

## 4. If a gateway rejects the request

Almost always the signature. Each gateway has exactly one function that builds
it, and that is the only place to look:

| Gateway | File | Function |
|---|---|---|
| JazzCash | `src/lib/gateways/jazzcash.ts` | `secureHash` |
| EasyPaisa | `src/lib/gateways/easypaisa.ts` | `encryptRequest` |
| Safepay | `src/lib/gateways/safepay.ts` | `verifyCallback` |

The JazzCash one is verified against the worked example in JazzCash's own
sandbox documentation and reproduces their published hash exactly, so if it
fails, the credentials or the field list are the suspects rather than the
algorithm.

EasyPaisa version their integration guide privately and different merchants get
different revisions. If the sandbox rejects the request, compare the field list
in `startPayment` against the PDF they send you — that is the difference.

---

## 5. What money moves where

The **advance payment** is what the patient pays online; the balance is settled
at the clinic. Both figures come from the service in the admin panel, so
changing a price there changes what is charged — there are no prices in the
code.

Refunds are not automated. Every gateway handles them from its own dashboard,
and a clinical refund usually needs a human decision anyway.
