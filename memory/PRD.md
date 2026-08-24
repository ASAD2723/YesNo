# yesno — Product Requirements Document

## Original Problem Statement
Build "yesno", an AI-powered website: users ask any question in a single search bar and get a large, visually dominant **YES** or **NO**. When uncertain, show **Yes% / No%** probability bars (totaling 100%). Each answer has a secondary **Reason** button that expands inline into WHY / EVIDENCE / SOURCES. Minimal, premium, editorial design. Local search history, example questions, elegant loading and error states. Keep API keys server-side.

## User Choices
- AI model: **Claude Sonnet 4.6** (via Emergent Universal LLM key)
- Sources: **AI reasoning only** (no live web search) — sources shown only when the model genuinely has them (often empty)
- History: **Browser localStorage**, no authentication
- Design: **Editorial minimal black & white**

## Architecture
- **Frontend**: React 19 + Tailwind + Framer Motion. Single-page app (`App.js`) with idle/loading/answer/error states. Components in `src/components/yesno/`. Playfair Display (display) + Outfit (UI) fonts. Paper-grain overlay, no gradients.
- **Backend**: FastAPI. `POST /api/answer` → `ai_provider.py` (pluggable `AIProvider` abstraction; `ClaudeProvider` uses `emergentintegrations.LlmChat` with `claude-sonnet-4-6`). Server validates/normalizes LLM JSON (`_sanitize`): probabilities forced to sum 100, answer derived from `yesProbability>=50`, certainty/confidence whitelisted, sources sanitized. Answers logged to MongoDB `answers` collection.
- **Secrets**: `EMERGENT_LLM_KEY` in `backend/.env` only. Frontend uses `REACT_APP_BACKEND_URL`.

## Personas
- Curious general user wanting a fast, clear verdict on a complex question.
- Decision-maker wanting a calibrated probability + reasoning + evidence.

## Implemented (2026-06)
- Single search bar with submit-on-Enter + arrow button, autofocus.
- Large YES/NO answer with scale-in animation and subtle check/x icon cue.
- Probability bars animating 0→value for non-definite answers, with estimate + confidence label.
- Reason button → inline expandable panel (WHY / EVIDENCE / SOURCES) via Framer Motion height animation.
- Source cards (title, publisher, description, date, clickable link) — rendered only when present.
- "yesno is thinking..." loading state (no spinner); error state with retry.
- Example question pills ("Try asking") that auto-submit.
- Recent history (localStorage, max 8, dedupe) with Clear; logo click resets to home.
- SEO metadata (title, description, OG, Twitter), accessibility (ARIA, focus-visible, reduced-motion), responsive/mobile layout.
- Server-side JSON validation of all LLM output; clean 422/502 errors, no key/stacktrace leakage.
- Tested: 8/8 backend cases pass, all frontend flows pass (desktop + mobile).

## Backlog (not yet built)
- **P1**: Live web research for real, current sources (search API integration).
- **P2**: Accounts + server-side synced history.
- **P2**: Monetization tiers (free daily limit / Pro deeper reasoning) — architecture is extensible.
- **P2**: Shareable answer links / OG image per answer.

## Next Tasks
- Await user feedback on the MVP experience.
