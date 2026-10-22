# Wanderly — travel discovery MVP

A mobile-first, **private-prototype** travel discovery website using 288 editorial draft destination profiles. Includes a photo-rich 2×2-card browse UI, saved places, and editable demonstration itineraries.

## Run locally

Requires Node.js 22+.

1. Download this repository (GitHub Code → Download ZIP), unzip and enter the folder in Terminal.
2. Run: npm run dev
3. Open http://localhost:3000 in Chrome.

The first screen and basic tag search work **without any API key**.

## Enable real AI search

Read [docs/ai-search.md](docs/ai-search.md) for setup. Copy .env.example to .env, add your own private OPENAI_API_KEY and restart npm run dev. Search using Find my escape. The site visibly indicates AI search vs keyword fallback.

AI interprets unconventional travel requests and semantically compares them with the catalogue. It does **not** generate or verify new destinations, travel prices, weather or activities.

## What works

- Search 288 draft destinations by natural-language meaning (when AI enabled) or prototype tags (without key).
- Region, scenery and vibe filters.
- Four-photo destination gallery cards, with automatically found Wikimedia Commons candidates, credit/source links and uniqueness checks that prevent the same file or identical-content hash being assigned to two places.
- Open destinations, choose 5/7/10-day **generic idea boards**, add, remove, reorder and move ideas.
- Save places and customisations to browser local storage (not synced).

## Collaborative travel discovery

Short requests such as `sunny` now open a **refine as you browse** panel instead of inventing food, nightlife and socialising preferences. Travellers can optionally tell Wanderly when they plan to travel, where they're starting from, and whether food, proximity or a particular mood matters. These choices are used transparently by the local preview and semantic ranking. They do not claim verified weather or journey times. See [Travel context and clarification](docs/travel-context.md).

## Feedback and low-cost testing

Rate destination cards with 👍 / 👎, add reasons to poor recommendations, then open **Feedback** in the top navigation to review or export your judgments. Ratings are stored locally in `data/feedback.local.json`, which is excluded from Git. They do **not** trigger OpenAI calls or automatically retrain the model. Repeating identical AI searches uses a temporary in-memory cache to avoid paying again during one server session.

See [docs/feedback.md](docs/feedback.md) for details and backup instructions. Also see [docs/photo-sourcing.md](docs/photo-sourcing.md) for unique-image sourcing, credits and cache backups.

## Known limitations

All 288 destination profiles are editorial **drafts**. They have not been fact-checked. The photo candidates are automatically found by destination name and may not actually depict the destination; they must be reviewed for accuracy and licensing before publication. The itinerary builder creates flexible generic examples, not real verified routes. Cost, season and weather filtering are not connected. Bookings and actual videos are not supported.

This website has not been deployed. The GitHub repository itself is currently public. Never commit an API key to GitHub.

## Test

Run: npm test
Run: npm run validate

See also [docs/review-checklist.md](docs/review-checklist.md) for the future research and editorial pipeline.
