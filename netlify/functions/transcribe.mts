import type { Config } from "@netlify/functions"
import { getStore } from "@netlify/blobs"
import { checkAccess } from "../lib/common.mts"

// Reassembles the uploaded chunks and sends them to ElevenLabs Scribe with word timestamps and speaker separation.
export default async (req: Request) => {
  const denied = checkAccess(req); if (denied) return denied
  const key = Netlify.env.get("ELEVENLABS_API_KEY")
  if (!key) return Response.json({ error: "ELEVENLABS_API_KEY is not set in Netlify environment variables." }, { status: 500 })
  const { id, parts, name, type, numSpeakers } = await req.json()
  if (!/^[a-z0-9-]{8,64}$/.test(id) || !(parts > 0 && parts < 200)) return Response.json({ error: "bad request" }, { status: 400 })
  const store = getStore("audio")
  const chunks: ArrayBuffer[] = []
  for (let i = 0; i < parts; i++) {
    const c = await store.get(`${id}/${i}`, { type: "arrayBuffer" })
    if (!c) return Response.json({ error: `missing chunk ${i}` }, { status: 400 })
    chunks.push(c)
  }
  const form = new FormData()
  form.append("file", new Blob(chunks, { type: type || "audio/mpeg" }), name || "audio")
  form.append("model_id", "scribe_v2")
  form.append("diarize", "true")
  form.append("timestamps_granularity", "word")
  form.append("tag_audio_events", "false")
  if (numSpeakers && numSpeakers > 0) form.append("num_speakers", String(numSpeakers))
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: form })
  const data = await res.json()
  for (let i = 0; i < parts; i++) await store.delete(`${id}/${i}`)
  if (!res.ok) return Response.json({ error: data?.detail?.message || data?.detail || `ElevenLabs error ${res.status}` }, { status: 502 })
  const words = (data.words || []).filter((w: any) => w.type === "word")
    .map((w: any) => ({ text: w.text, start: w.start, end: w.end, speaker: w.speaker_id || "speaker_0" }))
  return Response.json({ words, language: data.language_code })
}
export const config: Config = { path: "/api/transcribe", method: "POST" }
