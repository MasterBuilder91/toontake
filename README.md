# ToonTake

Upload an improvised voice recording (one take, all characters) and get a cartoon episode.

- `public/` — the site: character builder, scene plan editor, preview, and in-browser MP4 export (WebCodecs + mp4-muxer).
- Voice splitting (pitch/tone clustering) and word timing (Whisper via transformers.js, `public/asr-worker.js`) run entirely in the user's browser. Audio never leaves their device.
- `netlify/functions/` — `plan` (Claude directs the episode from the transcript), `analyze` (selfie → cartoon traits).

## Accounts and billing
- No login needed. Free: 1 MP4 export a day (watermarked), voice finding, quick auto-direct, hand-built characters, previews. Free users never call a paid API.
- Unlimited ($9.99/month, Stripe, needs a free account): no watermark, 30 AI-directed episodes, 10 selfie characters, 25,000 characters of typed scripts in the owner's voice per month. Caps keep a maxed-out subscriber's API cost well below the subscription.
- Counters live in Netlify Blobs. Set hard monthly spending limits in the Anthropic and ElevenLabs dashboards as a backstop.

## Environment variables (Netlify → Project configuration → Environment variables, scope: Functions)
- `ANTHROPIC_API_KEY` — Claude API key.
- `STRIPE_SECRET_KEY` — Stripe secret key (sk_test_… while testing).
- `STRIPE_PRICE_ID` — optional; defaults to the ToonTake Monthly price `price_1UYvyuGAtYKo4nymsi7t9plx` ($9.99/month).
- `STRIPE_WEBHOOK_SECRET` — signing secret of the webhook endpoint `https://<site>/api/stripe-webhook` (events: checkout.session.completed, customer.subscription.*).
- `ELEVENLABS_API_KEY` — for "Type it instead" (typed scripts spoken in the owner's cloned voice, unlimited plan only, 25,000 characters/month per user).
- Optional: `DEFAULT_VOICE_ID` (default `smCI2BCwin80MveoD81e`, Muhammed Abdullah's original professional clone), `TTS_MODEL` (default `eleven_multilingual_v2`).
- `ADMIN_EMAILS` — comma-separated emails with unlimited free use (the owner).
- Optional: `CLAUDE_MODEL`, `CLAUDE_MODEL_FAST`.

Redeploy after changing variables.
