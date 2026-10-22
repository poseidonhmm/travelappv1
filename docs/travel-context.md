# Wanderly discovery: clarify intent, remember context, avoid invented weather

## Short requests should not become fictional personalities

A one- or two-word search, such as **sunny**, should **not** be inflated into a detailed desire for nightlife, socialising, food, romance or luxury. For an underspecified request, Wanderly displays an inline refinement panel. Its three optional dimensions are:

- Is food a priority?
- Is somewhere nearer to home preferred, or an unfamiliar part of the world?
- What atmosphere would suit the traveller?

The panel also appears partway through longer result lists, so people can refine as they browse. Changing these controls immediately reorders preview recommendations locally. Pressing **Refine with AI** explicitly runs a paid API search. One-/two-word searches skip the paid GPT interpretation step and are embedded without additional invented detail.

For longer requests, the GPT interpreter now has explicit instructions to **only use stated preferences**, never treat missing preferences as confirmed, and refrain from claiming destination weather, costs or travel times.

## Travel context

The home location is **optional and user-entered**, never inferred from a browser address or GPS permission. The traveller can choose a broad departure region and optionally enter a country. The choice is saved in this browser's local storage as \`wanderly-search-prefs-v1\` and sent to the local API for a search. Wanderly doesn't ask for a street address.

The travel month is also **optional**, with a rolling 12-month choice. The calendar display shows an approximate hemisphere season **for the traveller's selected home** when we know it. Unknown climates are labelled unknown. Merely launching the app never assumes a trip is happening this month.

## Ranking transparency

- **Food important / essential**: modest boost for food-led destinations or food tours.
- **Closer to home first**: boosts the same country or broad world region only. This is a rough proxy, **not a verified flight time, kilometres or actual accessibility**.
- **Different part of the world**: modest boost for destinations outside the home region.
- **Selected mood**: modest boost for matching destinations.

These are **preferences, not hard filters**. The existing AI similarity ranking remains central, and explicit search text plus selected chips still matter.

### Climate limitation

The current 288-profile catalogue has no sourced, month-by-month climate attributes. Knowing that October is Northern Hemisphere autumn does **not** prove that October is rainy, sunny or safe at any particular destination. Consequently **travel month has no climate score** and the UI explicitly warns that sunshine, seasonal suitability and weather remain unverified.

Before ranking on month/weather, we should acquire trusted **monthly** weather normals (temperature, precipitation, sunshine), check local variation (altitude, monsoons), and display data sources and update dates. The same applies to travel time: source city-to-city/airport route data rather than guessing from continents.

## Local testing

Run \`npm test\` and \`npm run validate\`. Search **sunny**, choose an optional mood/food/origin preference, and click **Refine with AI** to see the faithful interpretation. Repeat with **romantic coastal food**, **quiet mountains**, and a destination name. Verify no fabricated monthly weather claims.
