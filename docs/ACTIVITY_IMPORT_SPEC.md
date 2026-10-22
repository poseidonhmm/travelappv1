# Activity import specification — version 1

Use this contract to prepare researched activity batches for any of Wanderly’s existing destinations. The importer performs **no research, network requests, price generation or automatic human approval**. Every factual statement and supplied numerical price must come from the cited evidence. Prefer fewer accurate records; use `null` for an unknown price or duration.

## Run and review

Requires Node.js 22+. From the project root:

```sh
npm run activities:import -- /absolute/path/batch.json --dry-run
npm run activities:import -- /absolute/path/batch.json
npm test
npm run validate
```

The equivalent direct command is `node scripts/import-activities.mjs /absolute/path/batch.json --dry-run`. Optional `--catalogue <path>` and `--destinations <path>` support isolated files; defaults are this project’s `data/activities.json` and `data/destinations.json`. Destinations, `.env`/`.env.*`, local review and cache files cannot be import targets. The importer never reads or modifies local review overrides, feedback, photos, embeddings, credentials or saved itineraries.

After a successful append, restart Wanderly to load the expanded catalogue. Open **Activity review**, inspect sources and make a human decision for each activity and price. Import does not approve records or images. Ready-for-review records can appear as explicitly unreviewed suggestions; usable source-backed prices remain provisional until manually approved.

For a safe, real-data no-op demonstration, export the existing catalogue to a batch and dry-run it; this reuses current evidence without inventing any:

```sh
node --input-type=module -e 'import{readFileSync}from"node:fs";console.log(JSON.stringify({schemaVersion:1,activities:JSON.parse(readFileSync("data/activities.json","utf8"))},null,2))' > /tmp/wanderly-existing-activities.json
npm run activities:import -- /tmp/wanderly-existing-activities.json --dry-run
```

## Batch and record fields

The top-level object is exactly `{ "schemaVersion": 1, "activities": [...] }`. An array can mix destinations. **Empty batches are rejected**; supply 1–1,000 records. Unknown keys at every object level are rejected, including misspellings. Runtime `revision` metadata is not an import field.

Each activity uses the following fields. Nullable fields must explicitly use `null`; do not substitute zero, an empty object or invented text. `verification` and `photo` may be omitted.

| Field | Required content |
| --- | --- |
| `id` | Stable unique lowercase letters/numbers separated by hyphens, at most 100 characters; usually destination plus attraction. |
| `destinationId` | Exact existing ID from `data/destinations.json`; never invent a destination slug. |
| `name`, `category`, `description` | Nonblank strings, at most 180 / 80 / 2,400 characters respectively. |
| `provider` | Provider/attraction name, at most 180 characters, or `null`. |
| `location` | `{label, sourceUrl, verified}`: nonblank label, at most 300 characters; cited source; `verified:true` means the source supports the location, **not human editorial approval**. |
| `durationMinutes`, `durationSourceUrl` | Verified approximate integer duration from 1–10,080 minutes and cited source, or `null`. An optional supplied duration URL must still be cited even if duration is unknown. |
| `interests`, `atmospheres` | Arrays of bounded nonblank strings, at most 24 normalized distinct entries each; each string at most 80 characters. |
| `seasonality` | `{months, restriction, sourceUrl, verified}`: unique month numbers 1–12, at most 12; restriction string at most 1,000 characters or `null`; source URL or `null`; boolean evidence flag. Any stated months/restriction or `verified:true` requires a cited source. Use `[]`, `null`, `null`, `false` when no seasonal claim is supported. |
| `considerations` | Up to 20 `{type, text, sourceUrl, verified}` objects; type is `safety`, `permit` or `eligibility`; nonblank text at most 1,000 characters, cited source and boolean evidence flag. Do not infer missing safety/permit guidance. |
| `sources` | **1–20** unique `{url, title, type, checkedAt}` entries. Nonblank title at most 300 characters; type `official` or `published`; real last-checked date `YYYY-MM-DD`. |
| `lastCheckedAt` | Required real date matching the most recent `sources[].checkedAt`. No future or impossible dates. |
| `verification` | Optional `{status, reviewedAt, reviewer, notes}`. Notes up to 4,000 characters; supplied standard review states/timestamps/names are accepted only as input metadata, then approval is removed. |
| `price` | Existing price schema or `null`; see below. Never derive a number from AI knowledge. |
| `photo` | Optional metadata object or `null`; see below. |

All activity evidence URLs must be HTTP(S), with no credentials and at most 2,048 characters. Placeholder/reserved source hosts (`example.invalid`, `example.com/org/net`, `.example`, `.test`, localhost) are rejected. Location and any supplied duration, seasonality, consideration or price source URL must match a dated `sources[].url` exactly after trimming. Source labels, dates and `verified` booleans are declarations that a reviewer must check; the importer does not fetch pages or prove their contents. Old research is retained as pending evidence and downstream freshness rules flag it.

**Vocabulary:** category and tags remain open strings, not enforced enums. Current categories are `culture`, `nature`; current interest terms include `culture`, `nature`, `walking`, `forest`, `wildlife`, `hot-springs`, `history`, `architecture`, `temples`, `gardens`; current atmospheres include `cultural`, `scenic`, `peaceful`, `relaxed`. Reuse these when accurate; propose additional terms consistently rather than changing the legacy schema. Matching understands a small set of explicit aliases; adding an arbitrary new tag does not create a new recommendation rule.

### Prices

Use `price:null` if evidence is insufficient. A supplied price uses exactly:

`currency, min, max, unit, covers, sourceUrl, checkedAt, confidence, reviewStatus, evidenceType, experience, unitVerified, conflict`, with optional `notes, reviewer, reviewedAt, reviewNotes`.

Currency is a three-letter uppercase code; min/max are finite nonnegative numbers with max ≥ min. Unit is `per-person`, `per-group` or `per-ticket`; confidence is `high`, `medium` or `low`; evidence type is `official` or `published`; review status is one of the standard statuses below. Coverage and identified experience are required strings, up to 1,200 / 300 characters. `unitVerified` and `conflict` are booleans. Notes are up to 2,000 characters. Dates must be real and cannot be in the future. High confidence requires direct official evidence, identified experience/coverage and verified unit. High/medium claims must match a dated catalogue source with the same evidence type; that source check cannot predate the price check.

Import preserves numerical amounts, currencies, confidence and other price facts. It changes a supplied `approved` price status to `ready-for-review` and discards imported reviewer/date/approval notes; other price statuses stay unchanged. It does not research, repair or approve prices. Existing pricing rules still exclude low-confidence, stale, conflicting or incomplete estimates; high freshness is 180 days and medium freshness is 365 days. Totals remain activity costs, separated by currency and pricing unit.

### Optional photo metadata

The complete photo object is:

`{source, fileName, imageUrl, pageUrl, title, creator, license, licenseUrl, attribution, checkedAt, subjectConfirmed}`.

- `source`: `wikimedia-commons` or `external`. Commons uses the exact `File:...` filename, matching its Commons description page and upload image filename; external uses `fileName:null`.
- URLs must be public HTTPS URLs without credentials. Include the original description/credit page, creator, title, attribution, recognized license and real last-checked date.
- Supported licenses are explicit-version **CC BY / CC BY-SA** (1.0, 2.0, 2.5, 3.0, 4.0), **CC0 1.0**, or documented **Public domain / PDM / PD**, paired with the matching Creative Commons license/public-domain URL. NC/ND, missing/unclear rights and mismatched licenses are rejected. Attribution remains required for public-domain records too.
- **Import always sets `subjectConfirmed:false`**, even if supplied `true`; a supplied nonboolean value is rejected. Missing photo becomes `null`. Public display requires an approved activity and human-confirmed subject relevance. The photo is not downloaded or researched during import.

## Normalization, duplicates and atomicity

All new activity review states become `ready-for-review`; reviewer is blank and review date is `null`. Review notes remain. Standard statuses are `draft`, `needs-research`, `ready-for-review`, `approved`, `rejected`, `needs-rechecking`. Fact evidence flags remain independent of human approval. Strings are trimmed; interest/atmosphere tags are deduplicated and sorted; source entries and seasonal months are sorted. Photo and price approval handling is described above.

- Unknown destinations, malformed fields, unsupported metadata, duplicate IDs **inside one batch**, missing evidence and conflicting existing IDs reject the **entire batch**. Errors identify zero-based `activities[index]` and the supplied ID where available.
- Existing IDs with identical normalized content are skipped safely. Object key order, tag order, imported approval stamps and photo confirmation cannot overwrite or demote an existing record. Conflicting facts or notes require the review workflow; imports never overwrite them.
- Existing catalogue objects and record bytes are retained. An actual append changes only the outer array delimiter/closing whitespace and adds new records. An all-skipped re-import leaves the complete catalogue bytes and modification time unchanged. Local review overrides are never consulted or modified, including existing approvals there.
- Mutating imports acquire adjacent `activities.json.import.lock`, reread inside that exclusive lock, write/fsync a same-directory temporary file, then atomically rename. Failures clean up owned locks/temporary files. A pre-existing lock is never stolen or deleted. A concurrent importer fails clearly and can be retried after the first finishes. If a process crashes, inspect the lock’s PID and remove it only after confirming its owner is no longer running.
- Dry run creates no lock or files and does not reserve the catalogue snapshot. Do not manually edit the catalogue during a real import. Detected concurrent manual changes abort the write. The lock coordinates this importer, not arbitrary external editors or a hosted database.

## Illustrative template — do not import unchanged

This example contains **no real attraction or research evidence**. Its unknown destination, reserved `.invalid` sources and placeholder date deliberately fail validation. Replace every placeholder with researched facts, exact known destination ID and actual checked sources; otherwise leave the record out of a real batch.

```json
{
  "schemaVersion": 1,
  "activities": [
    {
      "id": "replace-with-stable-activity-id",
      "destinationId": "replace-with-existing-destination-id",
      "name": "REPLACE with researched attraction name",
      "category": "nature",
      "description": "REPLACE with a description supported by the cited source.",
      "provider": null,
      "location": {
        "label": "REPLACE with source-supported location",
        "sourceUrl": "https://example.invalid/replace-with-official-visitor-page",
        "verified": true
      },
      "durationMinutes": null,
      "durationSourceUrl": null,
      "interests": [],
      "atmospheres": [],
      "seasonality": {"months": [], "restriction": null, "sourceUrl": null, "verified": false},
      "considerations": [],
      "sources": [
        {
          "url": "https://example.invalid/replace-with-official-visitor-page",
          "title": "REPLACE with actual source title",
          "type": "official",
          "checkedAt": "YYYY-MM-DD"
        }
      ],
      "lastCheckedAt": "YYYY-MM-DD",
      "verification": {"status": "ready-for-review", "reviewedAt": null, "reviewer": "", "notes": ""},
      "price": null,
      "photo": null
    }
  ]
}
```
