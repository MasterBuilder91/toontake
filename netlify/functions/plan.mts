import type { Config } from "@netlify/functions"
import { checkAccess, claude, extractJSON } from "../lib/common.mts"

const SETS = "living_room, kitchen, bedroom, bathroom, street, car, office, newsdesk, confessional, void"
const FX = "none (normal, close), far (yelling from another room / across the street), wall (heard through a wall or door), phone (phone call, walkie-talkie, intercom), outside (outdoors air), echo (big echo, dramatic or dream), room (small tiled room like a bathroom)"

const FORMATS: Record<string, string> = {
  bit: "Two-person comedy bit in the style of absurd late-night adult cartoons: deadpan, weird, hard cuts. Use reaction close-ups on the listener after punchlines.",
  monologue: "One-person monologue or rant straight to camera. Mostly close shots, cut wide on big moments.",
  confessional: "Reality-TV parody: group scenes in a house, intercut with single-character confessional cutaways (set 'confessional', one character) whenever a character comments on the others or talks to 'the camera'.",
  news: "Fake news broadcast parody: anchor at the newsdesk, cut to 'field reporter' scenes (street, etc.) when the topic moves.",
}

const SYSTEM = `You are the director/editor of a cheap, funny 2D cutout cartoon. The audio is already recorded (improvised). You decide where each moment happens and how it is shot. You cannot draw new things; you only choose from the sets, shots, emoji props, audio effects and title cards below.

Sets: ${SETS}
Shots: "wide" (everyone in the scene) or "close" (one character's face, give "on": characterId).
Audio fx per line: ${FX}
Props: an emoji (one character) popping up on screen with a short label, for objects or gags mentioned in the dialogue.
Cards: full-screen black title cards like "MEANWHILE..." or "3 HOURS LATER" placed in a pause (keep 1-2 s, only if it helps the joke).

Rules:
- Read the dialogue for clues about where it takes place and who is in the room. Change scene only when the conversation clearly moves.
- A character who is clearly not present (on the phone, yelling from another room) should NOT be in the scene cast; give their lines fx "phone"/"far"/"wall".
- Cut shots often, comedy style: close on whoever delivers a punchline, close on the listener right after for the reaction, wide for back-and-forth. Shots must start at or between line times. Avoid shots shorter than 1.2 s.
- For vertical (9:16) video prefer close shots.
- Times are in seconds and must stay within the episode length.
Return ONLY JSON:
{"title":"short funny episode title","scenes":[{"start":0,"set":"...","cast":["id",...]}],"shots":[{"start":0,"type":"wide|close","on":"id"}],"fx":[{"line":index,"fx":"..."}],"props":[{"start":s,"end":s,"emoji":"🍞","label":"few words"}],"cards":[{"start":s,"end":s,"text":"..."}],"notes":"one or two sentences explaining your direction choices"}
Only list fx for lines that are not "none".`

export default async (req: Request) => {
  const denied = checkAccess(req); if (denied) return denied
  try {
    const { format, aspect, cast, lines, duration, notes } = await req.json()
    if (!Array.isArray(lines) || lines.length === 0) return Response.json({ error: "No lines" }, { status: 400 })
    const script = lines.map((l: any, i: number) => `[${i}] ${l.start.toFixed(1)}-${l.end.toFixed(1)} ${l.char}: ${l.text}`).join("\n").slice(0, 60000)
    const user = `Format: ${FORMATS[format] || FORMATS.bit}
Aspect: ${aspect === "9:16" ? "vertical 9:16" : "horizontal 16:9"}
Episode length: ${Number(duration).toFixed(1)} s
Characters: ${cast.map((c: any) => `${c.id} = ${c.name}${c.look ? ` (${c.look})` : ""}`).join("; ")}
${notes ? `Creator's notes: ${notes}\n` : ""}
Dialogue (index, start-end, character id, text):
${script}`
    const text = await claude({
      model: Netlify.env.get("CLAUDE_MODEL") || "claude-sonnet-5-5",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    })
    return Response.json({ plan: extractJSON(text) })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
export const config: Config = { path: "/api/plan", method: "POST" }
