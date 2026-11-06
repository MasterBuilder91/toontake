import { getUser, admin } from "@netlify/identity"
import { getStore } from "@netlify/blobs"
import Stripe from "stripe"

export const LIMITS = {
  trialing: { plan: 3, analyze: 5 },
  active: { plan: 40, analyze: 20 },
} as const
type Kind = "plan" | "analyze"

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

function bucket(a: Account) {
  // Trial usage is counted once per trial; paid usage per calendar month.
  if (a.status === "trialing") return `${a.id}/trial`
  const d = new Date(); return `${a.id}/${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`
}

export async function usage(a: Account) {
  const u = (await getStore("usage").get(bucket(a), { type: "json" })) as Record<Kind, number> | null
  const lim = LIMITS[a.status === "trialing" ? "trialing" : "active"]
  return { used: { plan: u?.plan || 0, analyze: u?.analyze || 0 }, limit: lim }
}

// Gate for anything that spends money (Claude calls). Returns an error Response or null.
export async function spend(a: Account | null, kind: Kind): Promise<Response | null> {
  if (!a) return Response.json({ error: "Please log in.", code: "login" }, { status: 401 })
  if (!["trialing", "active"].includes(a.status)) return Response.json({ error: "Start your free trial to use this.", code: "subscribe" }, { status: 402 })
  if (a.admin) return null
  const store = getStore("usage"), key = bucket(a)
  const cur = ((await store.get(key, { type: "json" })) as Record<string, number> | null) || {}
  const lim = LIMITS[a.status === "trialing" ? "trialing" : "active"][kind]
  if ((cur[kind] || 0) >= lim) return Response.json({ error: a.status === "trialing" ? `Trial limit reached (${lim}). It resets when your subscription starts.` : `Monthly limit reached (${lim}). It resets next month.`, code: "limit" }, { status: 429 })
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
