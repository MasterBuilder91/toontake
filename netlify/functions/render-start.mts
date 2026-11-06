import type { Config, Context } from "@netlify/functions"
import { account, spend, isPaid } from "../lib/common.mts"

// Called before an MP4 export. Free users get one export a day (with a watermark); subscribers export freely.
export default async (req: Request, context: Context) => {
  const a = await account()
  const denied = await spend(a, context.ip, "render"); if (denied) return denied
  return Response.json({ ok: true, watermark: !(isPaid(a) || a?.admin) })
}
export const config: Config = { path: "/api/render-start", method: "POST" }
