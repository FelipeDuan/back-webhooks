import { faker } from "@faker-js/faker";
import { db } from ".";
import { webhooks } from "./schema";

type Provider = "stripe" | "paypal" | "mollie";

const providerEvents: Record<Provider, string[]> = {
  stripe: [
    "charge.succeeded",
    "charge.failed",
    "charge.refunded",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.created",
    "checkout.session.completed",
  ],
  paypal: [
    "PAYMENT.SALE.COMPLETED",
    "PAYMENT.SALE.DENIED",
    "BILLING.SUBSCRIPTION.CREATED",
    "BILLING.SUBSCRIPTION.CANCELLED",
    "INVOICING.INVOICE.PAID",
    "CUSTOMER.DISPUTE.CREATED",
  ],
  mollie: [
    "payment.paid",
    "payment.failed",
    "order.created",
    "order.paid",
    "chargeback.created",
  ],
};

// Probabilidade mais realista de status
const statusCodes = [
  200, 201, 202, 204, 302, 400, 401, 403, 404, 422, 429, 500, 502, 503,
];
const weights = [45, 5, 4, 2, 2, 8, 3, 1, 3, 6, 6, 8, 3, 4];

function weightedChoice<T>(items: T[], weights: number[]) {
  const total = weights.reduce((a, b) => a + b, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

function providerHeaders(provider: Provider): Record<string, string> {
  const base = {
    "content-type": "application/json",
    accept: "*/*",
    "accept-encoding": "gzip, deflate",
    "user-agent":
      provider === "stripe"
        ? "Stripe/1.0 (+https://stripe.com/docs/webhooks)"
        : provider === "paypal"
        ? "PayPal-HttpClient/1.0 (+https://developer.paypal.com)"
        : "Mollie/1.0 (+https://docs.mollie.com)",
  };

  if (provider === "stripe") {
    return {
      ...base,
      "stripe-signature": `t=${Math.floor(
        Date.now() / 1000
      )},v1=${faker.string.alphanumeric(64)}`,
    };
  }
  if (provider === "paypal") {
    return {
      ...base,
      "paypal-transmission-id": faker.string.uuid(),
      "paypal-auth-algo": "SHA256withRSA",
    };
  }
  return {
    ...base,
    "mollie-signature": faker.string.alphanumeric(128),
  };
}

function generateWebhook() {
  const provider = faker.helpers.arrayElement<Provider>([
    "stripe",
    "paypal",
    "mollie",
  ]);
  const event = faker.helpers.arrayElement(providerEvents[provider]);
  const createdAt = faker.date.recent({ days: 30 });

  const bodyObj = {
    id: `${provider}-${faker.string.alphanumeric(10)}`,
    event,
    provider,
    data: {
      amount: faker.finance.amount({ min: 5, max: 500, dec: 2 }),
      currency: faker.helpers.arrayElement(["usd", "eur", "brl", "gbp"]),
      customer: faker.internet.email(),
      description: faker.commerce.productDescription(),
      status: event.toLowerCase().includes("fail") ? "failed" : "succeeded",
    },
  };

  const body = JSON.stringify(bodyObj, null, 2);

  const statusCode = weightedChoice(statusCodes, weights);
  const pathname = `/webhooks/${provider}`;

  return {
    method: "POST",
    pathname,
    ip: faker.internet.ipv4(),
    statusCode,
    contentType: "application/json",
    contentLength: Buffer.byteLength(body),
    queryParams: {},
    headers: providerHeaders(provider),
    body,
    createdAt,
  };
}

async function seed() {
  console.log("🌱 Seeding database...");

  await db.delete(webhooks);

  const data = Array.from({ length: 100 }, () => generateWebhook());

  data.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  await db.insert(webhooks).values(data);

  console.log("✅ Database seeded successfully with 100 realistic webhooks!");
}

seed()
  .catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
