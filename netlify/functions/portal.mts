import type { Config } from "@netlify/functions"
import { account, stripe } from "../lib/common.mts"

// Stripe customer portal: update card, cancel, see invoices.
export default async (req: Request) => {
  const a = await account()
  if (!a) return Response.json({ error: "Please log in." }, { status: 401 })
  if (!a.meta.customer) return Response.json({ error: "No billing account yet." }, { status: 400 })
  const session = await stripe().billingPortal.sessions.create({ customer: a.meta.customer, return_url: new URL(req.url).origin + "/" })
  return Response.json({ url: session.url })
}
export const config: Config = { path: "/api/portal", method: "POST" }
