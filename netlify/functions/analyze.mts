import type { Config } from "@netlify/functions"
import { account, spend, claude, extractJSON } from "../lib/common.mts"

const PROMPT = `You design flat cartoon characters (simple cutout style) from a photo of a real adult who uploaded their own picture.
Describe only visible styling and coloring for the cartoon. Return ONLY JSON with these keys:
{"skin":"#hex (cartoon skin tone matching the photo)","hair":"bald|buzz|curly|fro|locs|braids|long|bun","hairColor":"#hex","headwear":"none|beanie|cap|kufi|durag|turban|hijab","hwColor":"#hex","beard":"none|jaw|full|goatee","mustache":true|false,"facialColor":"#hex","glasses":true|false,"eyes":"normal|heavy","brows":"arched|straight|thin","top":"tee|hoodie|suit|abaya","topColor":"#hex","pants":"joggers|jeans","pantsColor":"#hex","build":"slim|regular|big"}
Pick the closest option for each. If a part isn't visible, choose a plain neutral default.`

// Turns a selfie into cartoon traits. The photo is only sent to Claude for this one request and is not stored.
export default async (req: Request) => {
  const denied = await spend(await account(), "analyze"); if (denied) return denied
  try {
    const { image } = await req.json()
    const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(image || "")
    if (!m || m[3].length > 3_000_000) return Response.json({ error: "Send a JPEG/PNG under ~2 MB." }, { status: 400 })
    const text = await claude({
      model: Netlify.env.get("CLAUDE_MODEL_FAST") || "claude-haiku-5-5",
      max_tokens: 600,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: m[1], data: m[3] } },
        { type: "text", text: PROMPT },
      ] }],
    })
    return Response.json({ traits: extractJSON(text) })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
export const config: Config = { path: "/api/analyze", method: "POST" }
