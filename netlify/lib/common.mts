import { getUser, admin } from "@netlify/identity"
import { getStore } from "@netlify/blobs"
import Stripe from "stripe"

// Free (no account or not subscribed): per day, keyed by account or IP. Paid: per calendar month.
// Free users never touch a paid API (only the export counter, which costs nothing).
// Paid caps are set so even a maxed-out subscriber costs well under the $9.40 you keep.
export const LIMITS = {
  free: { plan: 0, analyze: 0, render: 1 },
  active: { plan: 30, analyze: 10, render: 100000 },
} as const
type Kind = "plan" | "analyze" | "render"

export function stripe() {
  const key = Netlify.env.get("STRIPE_SECRET_KEY")
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set in Netlify environment variables.")
  return new Stripe(key)
}

function isAdmin(email?: string) {
  const list = (Netlify.env.get("ADMIN_EMAILS") || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean)
  return !!email && list.includes(email.toLowerCase())
}

export type Account = { id: string; email?: string; status: string; admin: boolean; trialEnd?: number; periodStart?: number; meta: Record<string, any> }

// Logged-in user with fresh billing info (app_metadata is written by the Stripe webhook).
export async function account(): Promise<Account | null> {
  const u = await getUser()
  if (!u) return null
  let meta: Record<string, any> = u.appMetadata || {}
  try { meta = (await admin.getUser(u.id)).appMetadata || meta } catch (e) {}
  const adm = isAdmin(u.email)
  return { id: u.id, email: u.email, status: adm ? "active" : (meta.status || "none"), admin: adm, trialEnd: meta.trialEnd, periodStart: meta.periodStart, meta }
}

export const isPaid = (a: Account | null) => !!a && ["trialing", "active"].includes(a.status)

function bucket(a: Account | null, ip: string) {
  const d = new Date(), day = d.toISOString().slice(0, 10), month = day.slice(0, 7)
  if (isPaid(a)) return `paid/${a!.id}/${month}`
  return `free/${a ? a.id : "ip-" + ip}/${day}`
}

export async function usage(a: Account | null, ip: string) {
  const u = (await getStore("usage").get(bucket(a, ip), { type: "json" })) as Record<Kind, number> | null
  const lim = LIMITS[isPaid(a) ? "active" : "free"]
  return { paid: isPaid(a), period: isPaid(a) ? "month" : "day", used: { plan: u?.plan || 0, analyze: u?.analyze || 0, render: u?.render || 0 }, limit: lim }
}

// Gate for usage. Free users get a small daily allowance (no login needed); subscribers get monthly caps.
export async function spend(a: Account | null, ip: string, kind: Kind): Promise<Response | null> {
  if (a?.admin) return null
  const store = getStore("usage"), key = bucket(a, ip)
  const cur = ((await store.get(key, { type: "json" })) as Record<string, number> | null) || {}
  const lim = LIMITS[isPaid(a) ? "active" : "free"][kind]
  if (!isPaid(a) && lim === 0) {
    const msg = { plan: "AI directing is part of the unlimited plan.", analyze: "Selfie characters are part of the unlimited plan.", render: "Exports are part of the unlimited plan." }[kind]
    return Response.json({ error: msg, code: "upgrade" }, { status: 429 })
  }
  if ((cur[kind] || 0) >= lim) {
    const what = { plan: "AI-directed episode", analyze: "selfie character", render: "free export" }[kind]
    return Response.json(isPaid(a)
      ? { error: `Monthly limit reached for ${what}s (${lim}). It resets next month.`, code: "limit" }
      : { error: `You've used today's ${what}. Go unlimited to keep going, or come back tomorrow.`, code: "upgrade" }, { status: 429 })
  }
  cur[kind] = (cur[kind] || 0) + 1
  await store.setJSON(key, cur)
  return null
}

export async function claude(body: Record<string, unknown>): Promise<string> {
  const key = Netlify.env.get("ANTHROPIC_API_KEY")
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set in Netlify environment variables.")
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `Claude API error ${res.status}`)
  return (data.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("")
}

export function extractJSON(text: string): any {
  const a = text.indexOf("{"), b = text.lastIndexOf("}")
  if (a < 0 || b < a) throw new Error("No JSON in model reply")
  return JSON.parse(text.slice(a, b + 1))
}
