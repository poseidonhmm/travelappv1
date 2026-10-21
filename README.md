# Wanderly — Destination Database (Phase 1)

This repository now contains the **database foundation only**. The prior Wayfarer UI experiment has been superseded with the user's permission.

## What exists

- `data/destinations.json`: **88** varied destination profiles, all marked **draft**.
- `data/taxonomy.json`: controlled vocabularies for consistent search indexing.
- `database/schema.sql`: a future PostgreSQL schema for verified fact provenance, tags and review records.
- `scripts/validate.mjs`: strict checks for IDs, tags, evidence and publish status.
- `scripts/search.mjs`: small **keyword-only** smoke test (not AI semantic search).
- `scripts/wikidata-candidates.mjs`: optional read-only helper to find possible Wikidata matches **without automatically accepting them**.
- `test/catalog.test.mjs`: database and safety regression tests.

## Run

Use Node.js 22 or newer (no dependencies).

```bash
npm test
npm run validate
npm run search -- "feel-good food"
npm run search -- "dramatic landscape nightlife"
node scripts/wikidata-candidates.mjs "San Sebastián"
```

## Important: draft does not mean verified

All 88 travel summaries and tags are editorial starting points; they are **NOT fact-checked** and **NOT ready for publication as authoritative destination advice**. No weather, real-time price, hotel availability, flight or booking information is included.

`bestMonths` is intentionally empty; `budget.tier` and coordinates are null, instead of inventing climate/budget precision. The place names and countries are also pending source reconciliation. Each entry carries a `sources` list and a `geographic.verification` status.

**Never change an entry to `published` without at least one supporting source and a review date**. Factual subclaims (cost, season, coordinates) will require their own dated sources once added. A source URL is not proof that every assertion in a profile is supported.

## Proposed workflow

1. Curate the initial list and reject or merge low-quality entries.
2. Use Wikidata candidate suggestions to link each destination to a verified geographic identifier; check ambiguity manually. Structured Wikidata data is CC0: https://www.wikidata.org/wiki/Wikidata:Licensing
3. Verify subjective travel claims with multiple reliable references and an editorial review. Record links in `sources`.
4. Add sourced and time-scoped cost, geography, seasons, activities and media records. Store individual media licensing and attribution.
5. Approve selected destinations. Build search embeddings **only from approved profiles**; keep draft records out of public search results.
6. Add day-by-day itinerary tables later; weather and booking integrations explicitly deferred.

## Data design

One destination can support many itineraries. Locations can be cities, islands, coasts, broad regions or natural sites. **Do not** treat a broad region as a single precise weather/price point. Link narrower sub-destinations when needed.

Search should eventually combine semantic matching of approved descriptions + structured constraint filtering (region, budget, season, duration) + factual validation. A phrase like "posh city break" is an interpretation problem, not a factual database column.

## Licensing

The prose in this seed is newly drafted, not copied from travel guides. Geographic metadata may later be imported from Wikidata (CC0). Every third-party media asset needs license-specific checking and attribution; do not scrape unlicensed travel photography.

## Repository status

No hosted database or public frontend has been deployed by this commit. This file-based catalogue can seed Postgres/Supabase or be consumed by a web app directly after quality review.
