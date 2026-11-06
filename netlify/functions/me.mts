import type { Config, Context } from "@netlify/functions"
import { account, usage } from "../lib/common.mts"

export default async (req: Request, context: Context) => {
  const a = await account()
  return Response.json({
    user: a ? { email: a.email, status: a.status, admin: a.admin, hadTrial: !!a.meta.hadTrial } : null,
    usage: await usage(a, context.ip),
  })
}
export const config: Config = { path: "/api/me" }
