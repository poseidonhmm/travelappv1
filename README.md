# Wanderly — travel discovery and itinerary prototype

A mobile-first travel discovery app with **288 preserved editorial destination drafts**, AI search, saved places, destination photos, recommendation feedback, and editable browser-saved itineraries.

## Run locally

Requires Node.js 22+; no dependencies need installing.

```sh
cd ~/Documents/Wanderly
npm run dev
```

Open http://localhost:3000. Search and itinerary editing work without an API key. AI search uses the existing private key automatically. To explicitly enable AI after a previous disabled session, run `WANDERLY_AI_DISABLED=0 npm run dev`. For development or review without paid AI requests, run `WANDERLY_AI_DISABLED=1 npm run dev`. The switch takes precedence over an existing private `.env` key. Never commit `.env` or cache files.

## Discovery

The optional searchable **Where are you travelling from?** country selector derives a broad departure region from a sourced UN M49 mapping adapted to the existing catalogue categories. It sits beside the optional **When do you want to travel?** month field on desktop and stacks on mobile. Country, month and refinement preferences persist in this browser. No GPS, precise address, inferred home location, flight duration or flight price is used. **Part of the world** still filters destinations.

Results preserve the strongest matches and use adaptive, non-duplicating groups for broad proximity, different regions, expressed food interests, and nature/adventure interests. Optional food, near/far, atmosphere and beach questions refine the current results locally. A vague search such as `sunny` does not imply a detailed lifestyle. There is no sourced destination weather model or sunshine guarantee. See [travel context](docs/travel-context.md).

## Activities, itineraries and prices

Seven source-backed **Ready for review** records cover Rotorua, Lisbon and Kyoto. The other 285 destinations retain their editable personal idea boards and clearly show that specific activity research is pending. The records, prices and sources are detailed in [activity evidence](docs/activity-evidence.md).

Opening a researched destination suggests named experiences based on expressed interests, atmosphere, trip length and any source-backed seasonal restrictions. New outlines distribute these ideas without repeating them automatically. Existing v1 saved trips and edits remain intact. Add an experience to a chosen day, remove or reorder it, move it to any day, rename a day, and choose a 5/7/10-day outline. Edits and saved places remain browser-local; they are not synced.

Activity prices show the source, last check, confidence, coverage and review status. Daily and itinerary activity estimates count only usable evidence, identify unknown prices, and keep currencies and pricing units separate. Unknown, conflicting, low-confidence and stale prices never become zero. These estimates are **activity costs only**, not a holiday total. Price confidence is separate from human approval.

## Local activity verification

Open **Activity review** in the navigation to inspect sources and flags, edit structured facts/prices, leave notes, and approve activities and prices independently. Explicit approval requires a human reviewer name. Edits to approved facts return them to review; concurrent writes use revision checks.

Reviews persist as atomic overrides in ignored `data/activity-reviews.local.json`, independently of saved itinerary edits, existing destination editorial status, recommendation feedback, photos and embeddings. The working local interface is a foundation for the eventual Verification Studio; it has no hosted accounts or signed audit history. See [activity system](docs/activity-system.md).

## Preserved systems

- AI search and persistent embedding cache: [AI search setup](docs/ai-search.md).
- Recommendation judgments and export: [feedback](docs/feedback.md).
- Photo mosaics, linked credits and unique image candidates: [photo sourcing](docs/photo-sourcing.md).

All destination descriptions and automatic Wikimedia Commons photo candidates remain unverified drafts. Bookings, route feasibility, transfers, live availability and verified climate are not supported. Completed, tested stages are committed locally. Pushing to GitHub, merging and deployment require explicit approval. See [development workflow](AGENTS.md).

## Validation

```sh
npm test
npm run validate
```

Tests use mocked AI providers and temporary review/feedback/photo files. The validator checks all destinations and the activity catalogue. See [local review checklist](docs/phase-review.md) for testing the interface.
