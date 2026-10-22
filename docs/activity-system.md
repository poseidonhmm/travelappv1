# Evidence-backed activities and local verification

The activity catalogue is `data/activities.json`. It is deliberately small: researched examples cover Rotorua, Lisbon and Kyoto; the other destinations keep their editable itinerary and manual activity entry. Expand it with the append-only JSON importer described in [ACTIVITY_IMPORT_SPEC.md](ACTIVITY_IMPORT_SPEC.md); activity research happens separately. There are no paid API calls in this system.

## Modules and routes

- `public/activities.js`: shared schema validation, review flags, recommendation ranking, price eligibility, formatting and cost summaries. This is a pure module used by both browser and Node tests.
- `lib/activities.mjs`: local review store. The running review store treats its original catalogue as immutable; restart the server after a CLI import to load additions. Edits are atomic overrides in `data/activity-reviews.local.json`, which must remain Git-ignored. Reviews do not modify saved itineraries, destination reviews, recommendation feedback, photos or embeddings.
- `public/activity-review.js` and `.css`: the Activity review navigation panel. It exposes status filters, evidence links, structured record editing, notes and separate explicit activity/price approvals.
- `GET /api/activities` and `GET /api/activity-review`: `{items:[...]}` including local overrides and a revision per record.
- `POST /api/activity-review`: `{record,expectedRevision,action,reviewer,notes}`. Actions are `save`, `approve`, `approve-price` and `reject`. Successful response is `{saved:true,item}`; a stale revision returns 409. After a save the browser emits `wanderly:activities-updated` so the itinerary refreshes current catalogue evidence.

These routes belong to the existing loopback development server. The local panel is a functioning review workflow, not a hosted multi-user studio: it has no account authentication, signed reviewer identity or audit event history. Add those safeguards before deploying a shared editorial service. The independent model, stable IDs and revision-based writes give an eventual Verification Studio a reusable boundary.

## Schema and meanings

Every record has stable `id` and `destinationId`, name, category, description, nullable provider, location evidence, nullable evidenced approximate duration, interests, atmospheres, seasonality, safety/permit/eligibility considerations, sources, last check date, manual verification and an optional price.

A fact's `verified` boolean means the cited source supports that specific fact. It does **not** mean a human has approved the record. All researched initial records remain `ready-for-review`. The user interface labels these as awaiting human review; no import, ranking operation or save silently promotes a record.

Manual statuses are `draft`, `needs-research`, `ready-for-review`, `approved`, `rejected` and `needs-rechecking`. Recommending a record requires an identified destination, source evidence, sourced location, and either `ready-for-review` or `approved`. Draft, research, rejected and recheck states remain in the reviewer interface but do not enter new itinerary recommendations.

Unknown prices and durations use `null`. Seasonality with no supported claim uses empty months, null restriction/source and `verified:false`. Never manufacture an operating schedule, seasonal restriction or numeric price to fill a field. A non-null approximate duration requires its own source URL. Price fields support optional `notes` to explain evidence limits or contradictory sources.

## Price rules

An estimate has currency, min/max, unit, coverage, source URL, last-checked date, confidence, price review state, evidence type, identified experience, unit evidence and a conflict flag. Prices approved manually also retain reviewer and review time.

- **High:** direct official source, identified experience and coverage, verified unit and a price check within 180 days.
- **Medium:** official or credible published evidence with an identified experience, coverage and unit, checked within 365 days.
- **Low:** incomplete, old or uncertain evidence. Stored for review, excluded from totals.

High and medium price claims must reference a matching dated entry in the record’s source list with the same evidence type. An aggregate recent check date cannot hide an outdated source check: source dates are also flagged and block activity approval.

High confidence labels can age in the stored catalogue; eligibility is recalculated at display and calculation time. An estimate exceeding its freshness threshold is flagged and excluded. All conflicts, missing sources/dates/units, low confidence, future dates and non-reviewable price states are excluded. Pending human review is visibly distinguished from approval even when an estimate has usable source evidence.

Totals group by **currency and pricing unit**. Per-person, per-ticket and per-group amounts cannot be silently added together or converted without evidence. Counts identify priced and unknown activities; there is no zero substitution for unknown activities, currency conversion, passenger-count inference or claim that activity costs represent the holiday cost.

## Reviewing a record

1. Start the local app with `npm run dev` and open Activity review.
2. Inspect the original official and published source links, checking the location, experience, pricing unit and price caveats.
3. Expand the structured editor to correct facts, source dates, missing evidence or conflicting price details. Use review notes to explain changes.
4. Save changes, or enter your reviewer name and explicitly approve the activity or price. Approving an activity does not approve its price.
5. Records with missing location/activity evidence, unverified stated seasonality/considerations or outdated activity evidence cannot be approved until corrected. Prices with unresolved evidence flags cannot be approved.

Editing previously approved activity facts returns activity approval to `ready-for-review`. Editing approved price facts returns price approval to `ready-for-review`. Revision checks prevent one open review from overwriting a newer decision. Sources render as text or HTTP(S) links; arbitrary schemes are rejected by validation.

Run `npm test` for model/store regressions and `npm run validate` for catalogue checks. Tests use temporary directories, not the ignored local review or feedback files. Research provenance for the initial records is in `docs/activity-evidence.md`.

## Imported activities and their images

`npm run activities:import -- <batch.json> --dry-run` validates a complete researched batch; omit `--dry-run` to append it atomically. Duplicate IDs within a batch reject it. Existing identical content is skipped, and an existing ID with changed content rejects the batch. Import never edits local reviews, saved itineraries, prices in existing records, feedback, photos or embeddings. See the specification for source requirements and the optional image object.

`public/activity-photos.js` validates and renders image metadata independently of the destination photo system. `lib/activity-photos.mjs` caches validated display metadata by stable activity ID and a fingerprint of the current record, image and approval. The separate ignored cache is best-effort: a missing or unwritable cache cannot authorize an image or prevent a valid image from displaying. No image search, external metadata request or image download occurs on the server.

`GET /api/activities` returns only photo metadata eligible for public display. `GET /api/activity-review` retains the proposed photo for reviewer inspection. Imported photos always have `subjectConfirmed:false`; public display requires both explicit activity approval and subject confirmation. In Activity review, inspect the candidate and attribution, check the subject/reuse confirmation, then choose **Approve activity**. Metadata edits update the preview and clear the checkbox. Existing review rules revoke activity approval when saved facts change, so outdated photo approval cannot survive edits. Adding a photo to a record that had none requires saving the new metadata first, then confirming its preview and approving.

A null or missing photo remains compatible with existing records. Itinerary items continue storing activity IDs, not image URLs or approval snapshots. Cards and itinerary entries display the current approved image and its attribution, with neutral placeholders for missing, pending or failed images. No destination photo is reused as an activity image. These additions do not change pricing eligibility or the existing price review workflow.
