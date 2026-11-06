import type { Config } from "@netlify/functions"
import { getStore } from "@netlify/blobs"
import { checkAccess } from "../lib/common.mts"

// Receives one chunk (<4 MB) of an audio file and stores it in Netlify Blobs.
export default async (req: Request) => {
  const denied = checkAccess(req); if (denied) return denied
  const id = req.headers.get("x-id") || "", part = req.headers.get("x-part") || ""
  if (!/^[a-z0-9-]{8,64}$/.test(id) || !/^\d{1,3}$/.test(part)) return Response.json({ error: "bad id/part" }, { status: 400 })
  const buf = await req.arrayBuffer()
  if (buf.byteLength > 4_400_000) return Response.json({ error: "chunk too large" }, { status: 413 })
  await getStore("audio").set(`${id}/${part}`, buf)
  return Response.json({ ok: true })
}
export const config: Config = { path: "/api/upload", method: "POST" }
