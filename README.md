# Wayfarer

A responsive itinerary discovery website with six curated journeys, filters for region, duration, relative cost, landscape, vibe and season/date, four-photo moodboards, daily itineraries, and persistent editing and day reordering. A custom trip planner includes itinerary activities and USD budgets. Trips are saved in browser local storage; there are no accounts, bookings, or backend database. Clearing browser data removes saved trips.

## Download and open

Open [wayfarer.html](wayfarer.html) on GitHub and click **Download raw file** in the file toolbar. Open the downloaded HTML in a modern browser; no installation is required. Internet access is needed for photos, optional fonts, and video search links. Browser storage for local HTML files depends on your browser settings.

For all source files, use GitHub's **Code → Download ZIP**, then extract the archive.

## Development

Use Node.js 22 or newer. No third-party packages or credentials are required.

```sh
npm ci
npm run dev
```

The server listens on port 3000; override with `PORT`. Run `npm test` for HTTP checks. The app uses optional Google Fonts with local font fallbacks and externally hosted Unsplash moodboard photos. Images are illustrative rather than verified activity/location photos. Daily activity video links open YouTube searches; verified embedded videos remain future work. The starter catalog is static, not live availability or generated travel advice. Date filtering uses Northern Hemisphere calendar seasons. There is no production deployment or cross-device account sync.
