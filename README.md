# ToonTake

Upload an improvised voice recording (one take, all characters) and get a cartoon episode.

- `public/` — the site: character builder, scene plan editor, preview, and in-browser MP4 export (WebCodecs + mp4-muxer).
- Voice splitting (pitch/tone clustering) and word timing (Whisper via transformers.js, `public/asr-worker.js`) run entirely in the user's browser. Audio never leaves their device.
- `netlify/functions/` — `plan` (Claude directs the episode from the transcript), `analyze` (selfie → cartoon traits).

## Accounts and billing
- No login needed to use it. Free use per day (by account, or by IP when logged out): 1 MP4 export (with a "Made with ToonTake" watermark), 1 AI-directed episode, 1 selfie character. Voice finding, auto-direct and previews are unlimited.
- Unlimited: Stripe subscription, $9.99/month (ToonTake Monthly), no trial. Needs a free account (Netlify Identity). No watermark; 40 AI-directed episodes and 20 selfie characters a month.
- Counters live in Netlify Blobs.

## Environment variables (Netlify → Project configuration → Environment variables, scope: Functions)
- `ANTHROPIC_API_KEY` — Claude API key.
- `STRIPE_SECRET_KEY` — Stripe secret key (sk_test_… while testing).
- `STRIPE_PRICE_ID` — optional; defaults to the ToonTake Monthly price `price_1UYvyuGAtYKo4nymsi7t9plx` ($9.99/month).
- `STRIPE_WEBHOOK_SECRET` — signing secret of the webhook endpoint `https://<site>/api/stripe-webhook` (events: checkout.session.completed, customer.subscription.*).
- `ELEVENLABS_API_KEY` — for "Type it instead" (typed scripts spoken in the owner's cloned voice, unlimited plan only, 40,000 characters/month per user).
- Optional: `DEFAULT_VOICE_ID` (default `smCI2BCwin80MveoD81e`, Muhammed Abdullah's original professional clone), `TTS_MODEL` (default `eleven_multilingual_v2`).
- `ADMIN_EMAILS` — comma-separated emails with unlimited free use (the owner).
- Optional: `CLAUDE_MODEL`, `CLAUDE_MODEL_FAST`.

Redeploy after changing variables.
