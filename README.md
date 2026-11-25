# ToonTake — Talk it. Toon it.

Record a single voice take doing all your characters, upload it, and get a 2D animated cartoon episode — entirely on your device except for the AI direction step.

**Live site:** *(deploy via Netlify — set homepage URL in repo Settings → About)*

---

## What it does

1. **Record or upload** one audio take where you voice every character (or type a script on the Unlimited plan).
2. The app **splits your voices** on-device using pitch/tone clustering — no audio leaves your device.
3. Optional: Whisper (transformers.js, ~80 MB, downloads once) **transcribes the words** for captions.
4. **Claude AI directs** the episode — shot cuts, reaction close-ups, snap zooms, gag sound effects (Unlimited plan), or use the free quick auto-director.
5. **Preview** the cartoon, then **export an MP4** right in your browser using WebCodecs.

---

## Screenshot

![ToonTake screenshot placeholder](docs/screenshot.png)

*(replace with an actual screenshot of the app)*

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (no framework, no build step) |
| Auth | Netlify Identity (`@netlify/identity`) |
| Serverless | Netlify Functions (TypeScript, esbuild) |
| AI direction | Anthropic Claude API (`claude-sonnet-5-5`) |
| Selfie → character | Claude Vision via `/api/analyze` |
| Typed scripts | ElevenLabs TTS (`eleven_multilingual_v2`) |
| On-device speech | Whisper via `@xenova/transformers` (web worker) |
| Video encoding | WebCodecs + `mp4-muxer` |
| Billing | Stripe (Checkout + Customer Portal + webhooks) |
| Usage counters | Netlify Blobs |

---

## Architecture

```
public/               ← static site (served as-is by Netlify)
  index.html          ← entire UI + styles
  app.js              ← all client logic (cast, audio, voices, rendering)
  engine.js           ← SVG-based cartoon renderer (Toon.frame, Toon.portrait)
  asr-worker.js       ← Whisper worker (runs off main thread)
  vendor/             ← pre-bundled identity.js, mp4-muxer.js, transformers.min.js

netlify/functions/    ← serverless backend (TypeScript, esbuild)
  me.mts              ← /api/me — session info + usage
  plan.mts            ← /api/plan — Claude directs the episode (Unlimited)
  analyze.mts         ← /api/analyze — selfie → character traits (Unlimited)
  tts.mts             ← /api/tts — ElevenLabs voiced script (Unlimited)
  checkout.mts        ← /api/checkout — Stripe Checkout session
  portal.mts          ← /api/portal — Stripe Customer Portal
  stripe-webhook.mts  ← /api/stripe-webhook — sync subscription status
  render-start.mts    ← /api/render-start — gate + watermark flag
  lib/common.mts      ← shared: account(), spend(), claude(), extractJSON()
```

Free users never call a paid API — the usage gate is enforced server-side.

---

## Plans

| Feature | Free | Unlimited ($9.99/mo) |
|---|---|---|
| Voice recording & splitting | ✅ | ✅ |
| Quick auto-director | ✅ | ✅ |
| Hand-built characters | ✅ | ✅ |
| MP4 export (1/day, watermarked) | ✅ | — |
| MP4 export (unlimited, no watermark) | — | ✅ |
| AI-directed episodes (30/mo) | — | ✅ |
| Selfie → character (10/mo) | — | ✅ |
| Typed scripts in owner's voice (25k chars/mo) | — | ✅ |

---

## Run locally

You need a Netlify account and the Netlify CLI.

```bash
npm install -g netlify-cli
git clone https://github.com/MasterBuilder91/toontake.git
cd toontake
npm install
netlify dev
```

Open `http://localhost:8888`. Netlify Identity and all API routes work locally via `netlify dev`.

### Environment variables

Set these in Netlify → Project → Environment variables (scope: Functions), then `netlify dev` picks them up from `.env` or `netlify.toml`:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (AI directing, selfie analysis) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` for local dev) |
| `STRIPE_PRICE_ID` | Optional; defaults to the ToonTake Monthly price |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `ELEVENLABS_API_KEY` | ElevenLabs key (typed scripts, Unlimited only) |
| `ADMIN_EMAILS` | Comma-separated emails with owner-level free access |
| `DEFAULT_VOICE_ID` | Optional ElevenLabs voice ID |

> **Never commit secret keys.** Add them in the Netlify dashboard or a local `.env` file (which is in `.gitignore`).

---

## Security note

API keys live in Netlify environment variables. Free users never trigger a paid API call — the serverless functions enforce all spending gates before forwarding to Claude/ElevenLabs/Stripe.
