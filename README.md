# Wanderly — Mobile-first travel discovery prototype

This project combines the existing 88 draft destination profiles with a responsive search and itinerary exploration UI. The current objective is **hands-on visual testing**, before research and verification.

## Try the website in Codex

Open the `poseidonhmm/travelappv1` repository in Codex, then run:

```sh
npm run dev
```

Open the forwarded port **3000** preview (or http://localhost:3000 if working locally). Node.js 22 or later is required. There are **no external Node dependencies** to install and no API keys required.

Run:

```sh
npm test
npm run validate
```

## Try these things

1. Search **"feel-good food"**, **"dramatic landscape party"**, **"posh city break"** or **"tropical beach"**.
2. Choose a region and tap scenery/vibe chips to refine your results.
3. Browse the 2×2 photo moodboards on cards and open a destination.
4. Save a destination using the heart.
5. Open a draft itinerary, change the duration using the Discover page, and use arrow controls to reorder or move activities to another day. Add or remove ideas. Reset when you want to start again.
6. Open Saved to see your favourites.

## Features and honest limitations

- The UI searches the existing **88 draft destination profiles** from `data/destinations.json`.
- Search is a **simple local keyword-and-tag matcher**, not AI semantic search yet.
- 2×2 moodboard photos and activity thumbnails come from external Unsplash links. They are **illustrations and may not depict the destination or activity**. Do not publish before licensing and location verification.
- The itinerary is a **generic, editable inspiration outline**, not a real route. No actual attraction names, transfer times or live videos are claimed.
- The duration selector changes the **illustrative itinerary length**, not the destinations returned by the search. Budget and season filters are not yet enabled because that data is missing.
- Dates, live weather, prices, accommodation availability and booking redirects are not implemented.
- Saved trips and edits are stored only in the browser's localStorage. They can be lost when browser data is cleared and will not sync between devices.
- The local development server only binds to 127.0.0.1. A cloud preview may be forwarded by your development environment, but the site has **not been independently deployed to public hosting**.
- **The GitHub repository itself is public** at present. A non-deployed website is not the same as a private GitHub repository.

## Project layout

- `public/index.html` — app entry, brand and navigation
- `public/style.css` — responsive presentation and photo-led cards
- `public/app.js` — UI, navigation, saving and sample itinerary editor
- `public/recommend.js` — deterministic, explainable search
- `server.mjs` — minimal dependency-free local HTTP server
- `data/destinations.json` — original 88 draft editorial profiles
- `data/taxonomy.json` — controlled category vocabularies
- `database/schema.sql` — proposed persistence model (not deployed)
- `scripts/validate.mjs` — checks database shape and some review rules
- `docs/review-checklist.md` — future evidence/review process

## Next phase

After using this UI, we should iterate on which photos, card layouts and discovery interactions feel most convincing. We can then add AI semantic search and a systematic sourcing/review process, without rebuilding the UI from scratch.
