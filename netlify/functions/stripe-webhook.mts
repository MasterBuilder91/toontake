import type { Config } from "@netlify/functions"
import { admin } from "@netlify/identity"
import { getStore } from "@netlify/blobs"
import type Stripe from "stripe"
import { stripe } from "../lib/common.mts"

async function saveSub(s: Stripe, sub: Stripe.Subscription, extra: Record<string, any> = {}) {
  const userId = sub.metadata?.userId
  if (!userId) return
  const user = await admin.getUser(userId)
  const meta = { ...(user.appMetadata || {}) }
  const item = sub.items?.data?.[0] as any
  await admin.updateUser(userId, { app_metadata: {
    ...meta, ...extra,
    customer: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    sub: sub.id,
    status: sub.status,                       // trialing | active | past_due | canceled | ...
    trialEnd: sub.trial_end ? sub.trial_end * 1000 : null,
    periodStart: (item?.current_period_start ?? (sub as any).current_period_start ?? 0) * 1000,
    hadTrial: meta.hadTrial || !!sub.trial_end,
  } })
}

export default async (req: Request) => {
  const secret = Netlify.env.get("STRIPE_WEBHOOK_SECRET")
  if (!secret) return new Response("missing secret", { status: 500 })
  const s = stripe()
  let event: Stripe.Event
  try { event = await s.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature") || "", secret) }
  catch (e: any) { return new Response(`bad signature: ${e.message}`, { status: 400 }) }

  try {
    if (event.type === "checkout.session.completed") {
      const cs = event.data.object as Stripe.Checkout.Session
      if (cs.mode === "subscription" && cs.subscription) {
        let sub = await s.subscriptions.retrieve(cs.subscription as string, { expand: ["default_payment_method"] })
        // One free trial per card: if this card already had a trial on another account, end the trial now (charges immediately).
        const pm = sub.default_payment_method as Stripe.PaymentMethod | null
        const fp = pm?.card?.fingerprint
        if (fp && sub.status === "trialing") {
          const store = getStore("card-fingerprints")
          const owner = await store.get(fp)
          if (owner && owner !== sub.metadata.userId) sub = await s.subscriptions.update(sub.id, { trial_end: "now" })
          else if (!owner) await store.set(fp, sub.metadata.userId)
        }
        await saveSub(s, sub)
      }
    } else if (event.type.startsWith("customer.subscription.")) {
      await saveSub(s, event.data.object as Stripe.Subscription)
    }
  } catch (e: any) {
    console.error("webhook handling failed", e)
    return new Response("handler error", { status: 500 }) // Stripe will retry
  }
  return Response.json({ received: true })
}
export const config: Config = { path: "/api/stripe-webhook", method: "POST" }
