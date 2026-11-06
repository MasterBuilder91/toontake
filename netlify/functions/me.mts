import type { Config } from "@netlify/functions"
import { account, usage } from "../lib/common.mts"

export default async () => {
  const a = await account()
  if (!a) return Response.json({ user: null })
  return Response.json({ user: { email: a.email, status: a.status, admin: a.admin, trialEnd: a.trialEnd || null, hadTrial: !!a.meta.hadTrial }, usage: await usage(a) })
}
export const config: Config = { path: "/api/me" }
