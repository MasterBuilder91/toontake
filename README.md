# ToonTake

Upload an improvised voice recording (one take, all characters) and get a cartoon episode.

- `public/` — the site: character builder, scene plan editor, preview, and in-browser MP4 export (WebCodecs + mp4-muxer).
- `netlify/functions/` — `upload` (chunks to Netlify Blobs), `transcribe` (ElevenLabs Scribe v2 with speaker separation), `plan` (Claude directs the episode), `analyze` (selfie → cartoon traits).

## Environment variables (Netlify → Project configuration → Environment variables, scope: Functions)
- `ACCESS_CODE` — the beta password users type in.
- `ANTHROPIC_API_KEY` — Claude API key (console.anthropic.com).
- `ELEVENLABS_API_KEY` — ElevenLabs API key with Speech-to-Text access.
- Optional: `CLAUDE_MODEL` (default claude-sonnet-5-5), `CLAUDE_MODEL_FAST` (default claude-haiku-5-5).

Redeploy after changing variables.
