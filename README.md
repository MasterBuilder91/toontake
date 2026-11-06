# ToonTake

Upload an improvised voice recording (one take, all characters) and get a cartoon episode.

- `public/` — the site: character builder, scene plan editor, preview, and in-browser MP4 export (WebCodecs + mp4-muxer).
- Voice splitting (pitch/tone clustering) and word timing (Whisper via transformers.js, `public/asr-worker.js`) run entirely in the user's browser. Audio never leaves their device.
- `netlify/functions/` — `plan` (Claude directs the episode from the transcript), `analyze` (selfie → cartoon traits).

## Environment variables (Netlify → Project configuration → Environment variables, scope: Functions)
- `ACCESS_CODE` — the beta password users type in.
- `ANTHROPIC_API_KEY` — Claude API key (console.anthropic.com).
- Optional: `CLAUDE_MODEL` (default claude-sonnet-5-5), `CLAUDE_MODEL_FAST` (default claude-haiku-5-5).

Redeploy after changing variables.
