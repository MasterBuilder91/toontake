import type { Config, Context } from "@netlify/functions"
import { getStore } from "@netlify/blobs"
import { account, isPaid } from "../lib/common.mts"

// "Type it instead": turns a typed script into speech in the owner's cloned voice (ElevenLabs).
// Unlimited-plan only, with a monthly character cap so one user can't run up the bill.
const DEFAULT_VOICE = "smCI2BCwin80MveoD81e" // Muhammed Abdullah (original professional clone)
const MONTHLY_CHARS = 25000
const STYLES: Record<string, { stability: number; similarity_boost: number; style: number; speed: number }> = {
  normal:  { stability: 0.5,  similarity_boost: 0.8, style: 0.2, speed: 1.0 },
  excited: { stability: 0.3,  similarity_boost: 0.8, style: 0.6, speed: 1.08 },
  calm:    { stability: 0.75, similarity_boost: 0.8, style: 0.1, speed: 0.92 },
  angry:   { stability: 0.25, similarity_boost: 0.8, style: 0.7, speed: 1.05 },
  deadpan: { stability: 0.9,  similarity_boost: 0.8, style: 0.0, speed: 0.95 },
}

export default async (req: Request, context: Context) => {
  const a = await account()
  if (!a) return Response.json({ error: "Log in to use typed scripts.", code: "login" }, { status: 401 })
  if (!isPaid(a) && !a.admin) return Response.json({ error: "Typed scripts in MasterBuilder91's voice are part of the unlimited plan.", code: "upgrade" }, { status: 429 })
  const key = Netlify.env.get("ELEVENLABS_API_KEY")
  if (!key) return Response.json({ error: "ELEVENLABS_API_KEY is not set in Netlify environment variables." }, { status: 500 })

  const { lines } = await req.json()
  if (!Array.isArray(lines) || !lines.length || lines.length > 80) return Response.json({ error: "Send 1 to 80 lines." }, { status: 400 })
  const clean = lines.map((l: any) => ({ text: String(l.text || "").trim().slice(0, 600), style: STYLES[l.style] ? l.style : "normal" })).filter((l: any) => l.text)
  const chars = clean.reduce((s: number, l: any) => s + l.text.length, 0)
  if (chars > 5000) return Response.json({ error: "Keep one episode's script under 5,000 characters." }, { status: 400 })

  // monthly character cap
  const month = new Date().toISOString().slice(0, 7), store = getStore("usage"), ukey = `tts/${a.id}/${month}`
  const used = Number((await store.get(ukey)) || 0)
  if (!a.admin && used + chars > MONTHLY_CHARS) return Response.json({ error: `Monthly typed-script limit reached (${MONTHLY_CHARS.toLocaleString()} characters). It resets next month.`, code: "limit" }, { status: 429 })
  await store.set(ukey, String(used + chars))

  const voice = Netlify.env.get("DEFAULT_VOICE_ID") || DEFAULT_VOICE
  const model = Netlify.env.get("TTS_MODEL") || "eleven_multilingual_v2"
  const one = async (l: any) => {
    const s = STYLES[l.style]
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_96`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({ text: l.text, model_id: model, voice_settings: { stability: s.stability, similarity_boost: s.similarity_boost, style: s.style, speed: s.speed, use_speaker_boost: true } }),
    })
    if (!r.ok) { let m = `ElevenLabs error ${r.status}`; try { const j = await r.json(); m = j?.detail?.message || j?.detail || m } catch (e) {} throw new Error(m) }
    return Buffer.from(await r.arrayBuffer()).toString("base64")
  }
  try {
    const out: string[] = new Array(clean.length)
    let i = 0
    await Promise.all(Array.from({ length: 4 }, async () => { while (i < clean.length) { const k = i++; out[k] = await one(clean[k]) } }))
    return Response.json({ audio: out, charsUsed: used + chars, charsLimit: MONTHLY_CHARS })
  } catch (e: any) {
    await store.set(ukey, String(used)) // refund on failure
    return Response.json({ error: e.message }, { status: 502 })
  }
}
export const config: Config = { path: "/api/tts", method: "POST" }
