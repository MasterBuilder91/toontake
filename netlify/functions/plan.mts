import type { Config, Context } from "@netlify/functions"
import { account, spend, claude, extractJSON } from "../lib/common.mts"

const SETS = "living_room, kitchen, bedroom, bathroom, street, car, office, newsdesk, confessional, void"
const FX = "none (normal, close), far (yelling from another room / across the street), wall (heard through a wall or door), phone (phone call, walkie-talkie, intercom), outside (outdoors air), echo (big echo, dramatic or dream), room (small tiled room like a bathroom)"

const FORMATS: Record<string, string> = {
  bit: "Two-person comedy bit in the style of absurd late-night adult cartoons: deadpan, weird, hard cuts. Use reaction close-ups on the listener after punchlines.",
  monologue: "One-person monologue or rant straight to camera. Mostly close shots, cut wide on big moments.",
  confessional: "Reality-TV parody: group scenes in a house, intercut with single-character confessional cutaways (set 'confessional', one character) whenever a character comments on the others or talks to 'the camera'.",
  news: "Fake news broadcast parody: anchor at the newsdesk, cut to 'field reporter' scenes (street, etc.) when the topic moves.",
}

const SYSTEM = `You are the director AND comedy editor of a cheap, funny 2D cutout cartoon in the spirit of Family Guy and Aqua Teen Hunger Force. The audio is already recorded (improvised). You cannot change the words. Your job is to make what's already there land as hard as possible: timing, reactions, cutaways, sound stings. You only choose from the tools below.

FIRST, read the whole dialogue and find the comedy: setups, punchlines, absurd claims, awkward pauses, insults, reveals, and any "this is like the time…" / "remember when…" / story moments that could become a cutaway.

TOOLS
Sets: ${SETS}
Shots: "wide" (everyone) or "close" (one face, "on": characterId).
Line audio fx: ${FX}
Beats (camera gags):
  - "zoom": dramatic snap zoom onto a face ("on") for 0.6–1.5 s. Use on punchlines, outrageous claims, or the listener's horrified realization.
  - "shake": camera shake 0.3–0.8 s on yelling, crashes, big reveals.
  - "freeze": freeze-frame 1–2 s placed in a pause, with "text": a dry narrator-style caption that undercuts the moment (e.g. "He had not, in fact, paid the light bill."). Max one every ~30 s.
Reactions: {"on":id,"face":"shocked|smug|confused|angry","start","end"} faces on any character, mostly on the LISTENER right after a line lands.
SFX: {"t":seconds,"sound":"whoosh|scratch|crickets|sting|rimshot|pop|boing|dun"}: scratch = record scratch when something crazy is said; crickets = awkward silence; rimshot = after a corny joke; sting/dun = dramatic reveal; whoosh = snap zooms and scene changes; pop/boing = props appearing, silly moments.
Cutaways: a scene with "cutaway": true, a "label" (e.g. "Last Tuesday", "Meanwhile", "His imagination") and its own set/cast, shown while a character tells a story or makes a comparison; return to the main scene right after.
Props: emoji pop-ups with a short label for objects named in the joke.
Cards: full-screen black title cards ("3 HOURS LATER") only in real pauses.

RULES
- Funny beats when they are earned. Don't put a gag on every line: aim for one strong moment roughly every 8–15 seconds, and let normal back-and-forth breathe with simple shot cuts.
- Reaction close-ups on the listener after punchlines are the backbone. Awkward silences (gaps over ~1 s) are gold: hold on a face, add crickets.
- A character not physically present (phone, other room) is NOT in the scene cast; give their lines fx "phone"/"far"/"wall".
- Times are seconds within the episode. Shots/beats start at or between line times. Avoid shots shorter than 1.2 s (snap zooms excepted).
- Vertical 9:16: prefer close shots.
Return ONLY JSON:
{"title":"short funny episode title","scenes":[{"start":0,"set":"...","cast":["id"],"cutaway":false,"label":""}],"shots":[{"start":0,"type":"wide|close","on":"id"}],"beats":[{"type":"zoom|shake|freeze","start":s,"end":s,"on":"id","text":"..."}],"reactions":[{"on":"id","face":"shocked","start":s,"end":s}],"sfx":[{"t":s,"sound":"rimshot"}],"fx":[{"line":index,"fx":"..."}],"props":[{"start":s,"end":s,"emoji":"🍞","label":"few words"}],"cards":[{"start":s,"end":s,"text":"..."}],"notes":"one or two sentences: where the jokes are and what you did with them"}
Only list fx for lines that are not "none".`

export default async (req: Request, context: Context) => {
  const denied = await spend(await account(), context.ip, "plan"); if (denied) return denied
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
      max_tokens: 6000,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    })
    return Response.json({ plan: extractJSON(text) })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
export const config: Config = { path: "/api/plan", method: "POST" }
