# ToonTake

Upload an improvised voice recording (one take, all characters) and get a cartoon episode.

- `public/` — the site: character builder, scene plan editor, preview, and in-browser MP4 export (WebCodecs + mp4-muxer).
- Voice splitting (pitch/tone clustering) and word timing (Whisper via transformers.js, `public/asr-worker.js`) run entirely in the user's browser. Audio never leaves their device.
- `netlify/functions/` — `plan` (Claude directs the episode from the transcript), `analyze` (selfie → cartoon traits).

## Accounts and billing
- Login: Netlify Identity (enable it in the Netlify dashboard → Project → Identity; registration Open).
- Billing: Stripe Checkout subscription, 7-day free trial with card required, one trial per card (card fingerprint check in the webhook).
- Usage caps on paid AI calls (Claude): trial 3 directed episodes / 5 selfie characters; paid 40 / 20 per month. Stored in Netlify Blobs.

## Environment variables (Netlify → Project configuration → Environment variables, scope: Functions)
- `ANTHROPIC_API_KEY` — Claude API key.
- `STRIPE_SECRET_KEY` — Stripe secret key (sk_test_… while testing).
- `STRIPE_PRICE_ID` — the monthly price ID (price_…).
- `STRIPE_WEBHOOK_SECRET` — signing secret of the webhook endpoint `https://<site>/api/stripe-webhook` (events: checkout.session.completed, customer.subscription.*).
- `ADMIN_EMAILS` — comma-separated emails with unlimited free use (the owner).
- Optional: `CLAUDE_MODEL`, `CLAUDE_MODEL_FAST`.

Redeploy after changing variables.
