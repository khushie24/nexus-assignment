# NexusIntel

**Turn a one-line product idea into a founder's competitive playbook — competitors, feature gaps, ranked leads, and a same-day action list, grounded in live web data instead of model guesswork.**

A founder shouldn't have to spend a week manually researching competitors before they know what to build next. NexusIntel takes a product description, website, or company name, and in under a minute returns a structured, evidence-backed view of the market: who you're up against, where you're behind, who to sell to first, and what to do today.

**Live app:** [nexus-intel.vercel.app]([https://nexus-intel.vercel.app](https://nexus-assignment-sooty.vercel.app/))
**Repo:** this repository

---

## The core problem this solves

Generic LLM output is the easy, wrong way to build this. Ask a model "who competes with my bakery website" with no grounding and it will confidently invent plausible-sounding e-commerce platforms that have nothing to do with the actual business. That's not useful — it's a hallucination with good formatting.

NexusIntel's design is built around one rule: **the model never speaks first.** Every competitor, lead, and recommendation is generated only after a live web search (Tavily) has retrieved real, current context about that specific product or market. The LLM's (Groq / Llama 3.3 70B) job is to *structure and reason over real evidence*, not to recall facts from training data. This is the difference between a tool that's directionally right and one that's just well-formatted noise — and it's the single biggest design decision in this codebase.

---

## What it actually does

**1. Competitor Analysis** — identifies 5–7 real competitors with pricing, positioning, strengths/weaknesses, feature lists, and a threat rating, each backed by retrieved evidence and a confidence score.

**2. Lead Generation** — surfaces target companies and likely decision-makers (name, title, company, size, location) ranked by a priority score, with the reasoning for that ranking shown, not hidden.

**3. Recommendation Engine** — five-deep, reasoned lists across product (what to build next), market (opportunities and risks), and sales (who to contact first) — every recommendation states *why*, not just *what*.

**4. Founder Dashboard** — collapses all of the above into "what do I do today": biggest competitive threat, biggest opportunity, top 5 actions, feature matrix, positioning map, pricing comparison.

**5. Explainability by design** — every competitor, lead, and recommendation carries a `confidence score` and a `kind: verified | inferred | assumption` tag. The product never claims certainty it doesn't have, and a user can always see whether a given insight came from search results or model inference.

---

## Architecture

```
User input (product / URL / company name)
        │
        ▼
  Input validation & sanitization
  (length limits, URL protocol check, XSS-pattern stripping)
        │
        ▼
  ┌─────────────────────────────────────────┐
  │  Tavily web search — grounding pass      │
  │  (competitor landscape, target market)   │
  └─────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────┐
  │  Groq (Llama 3.3 70B) — structuring pass │
  │  Competitors · Leads · Recommendations   │
  │  run in parallel where independent       │
  └─────────────────────────────────────────┘
        │
        ▼
  Output normalization layer
  (coerces partial/malformed AI JSON into safe,
   typed shapes before it ever reaches a component)
        │
        ▼
  Feature matrix · Positioning map · Pricing chart
  · Action items · Founder dashboard
```

**Reliability path:** if live search or the AI call fails, times out, or returns malformed JSON, the pipeline doesn't error out to the user — it falls through to a deterministic, template-based fallback engine (`runFallbackAnalysis`) so the app always returns a usable result instead of a blank screen or a stack trace. This is a conscious trade-off documented below, not a hidden gap.

### Why this structure
- **Search before generation** (`lib/tavily.ts` → `lib/groq.ts`) — grounds every AI-generated claim in retrieved evidence, which is what separates this from a tool that just dresses up hallucinations.
- **Runtime normalization, not just TypeScript types** — `JSON.parse()` + a type assertion is a compile-time promise, not a runtime guarantee. A model can return a string array where a string was promised, or vice versa, no matter how strict the types are. Every AI response passes through explicit normalizer functions (`normalizeCompetitor`, `normalizeLead`, `normalizeRecommendation`, `normalizeRisks`) that coerce whatever shape comes back into something the UI can safely render, with sane defaults for missing fields.
- **Parallelized independent work** — competitor analysis, lead generation, and recommendation generation run concurrently once their shared inputs (product profile, search context) are ready, rather than serially, to keep response time reasonable against Vercel's function timeout.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript, strict typing throughout |
| AI | Groq — Llama 3.3 70B Versatile |
| Web search / grounding | Tavily Search API |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Setup

### 1. Install
```bash
git clone <this-repo-url>
cd nexus-intel
npm install
```

### 2. Environment variables
Create `.env.local` in the project root:
```bash
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
```
- Groq: free tier, no credit card — [console.groq.com](https://console.groq.com)
- Tavily: free tier, 1,000 requests/month — [tavily.com](https://tavily.com)

If either key is missing, the corresponding client returns empty/null rather than throwing, and the app falls back to template-based analysis — it will still run, just without live grounding.

### 3. Run
```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve production build
```

---

## Security & reliability notes

- All user input is length-capped and sanitized (HTML/script-pattern stripping) before it reaches any API call.
- API keys are read from environment variables only; never exposed to the client or logged.
- Both the Groq and Tavily clients enforce hard timeouts and fail closed (return `null`/empty) rather than hanging a request.
- Malformed AI JSON is caught and normalized, not trusted blindly — see "Why this structure" above.
- The `/api/analyze` route never bubbles a raw internal error message to the client; it returns a generic, actionable message instead.

---

## Known limitations & assumptions

Being upfront about these rather than hiding them:

- **Lead contact details (name, title, email) are AI-inferred, not scraped from a verified directory.** They're explicitly marked `inferred` or `assumption` in the UI and should be validated before outreach — this product surfaces *who to look for*, not a guaranteed-accurate contact database.
- **Pricing data is sourced from search results where available; otherwise estimated** and flagged accordingly via the confidence/evidence system.
- **Positioning map coordinates are relative, model-derived placements**, not measured market-share or revenue figures — useful for directional intuition, not investor-grade market sizing.
- **The fallback engine activates silently when live calls fail.** This was a deliberate choice to prioritize "always returns something usable" over "always returns live data" — appropriate for a tool meant to support a decision, not be the sole source of truth for one.
- Free-tier API rate limits (Groq, Tavily) mean heavy concurrent usage may degrade response quality or speed; this wasn't built against a production-scale traffic assumption.

---

## What I'd build next with more time

- Persist analyses (currently stateless per-request) so a founder can revisit or compare runs over time
- Real lead verification via a dedicated enrichment API instead of inference alone
- PDF export alongside CSV
- Per-section caching to avoid re-running unaffected modules when a user only wants to refresh leads, for example
