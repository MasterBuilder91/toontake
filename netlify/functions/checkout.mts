import type { Config } from "@netlify/functions"
import { account, stripe } from "../lib/common.mts"

// Starts Stripe Checkout for the monthly plan. (Free daily use replaces a trial.)
export default async (req: Request) => {
  const a = await account()
  if (!a) return Response.json({ error: "Please log in." }, { status: 401 })
  if (["trialing", "active"].includes(a.status)) return Response.json({ error: "You already have an active plan." }, { status: 400 })
  const price = Netlify.env.get("STRIPE_PRICE_ID") || "price_1UYvyuGAtYKo4nymsi7t9plx"
  if (!price) return Response.json({ error: "STRIPE_PRICE_ID is not set." }, { status: 500 })
  const origin = new URL(req.url).origin
  const s = stripe()
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    payment_method_collection: "always",
    customer: a.meta.customer || undefined,
    customer_email: a.meta.customer ? undefined : a.email,
    client_reference_id: a.id,
    subscription_data: {
      metadata: { userId: a.id },
    },
    metadata: { userId: a.id },
    allow_promotion_codes: true,
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancel`,
  })
  return Response.json({ url: session.url })
}
export const config: Config = { path: "/api/checkout", method: "POST" }
