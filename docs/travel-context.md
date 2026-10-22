# Discovery context and optional refinement

Country and travel month are optional, user-selected fields displayed before secondary filters. The searchable country list covers 250 countries/areas from the [UN M49 table](https://unstats.un.org/unsd/methodology/m49/), checked 22 October 2026. ISO-alpha3 and M49 identifiers are retained in `public/countries.js`; source comments document regional adaptations (including existing Middle East and Türkiye categories) and UN FAQ statistical extensions. Country names and aliases resolve to a canonical choice. Invalid text cannot silently become a known origin. Region is derived in the browser and API; supplying only an old departure region does not imply a home country.

The destination **Part of the world** filter remains independent. No address, GPS, IP lookup, flight route, journey duration or actual travel cost is inferred. Near/far matching uses only same-country and broad regional proxies, so labels explicitly qualify this.

Country, month, food priority, proximity, atmosphere and beach priority use the existing browser-local `wanderly-search-prefs-v1` key. Old country names migrate through aliases; old region-only data is ignored. Departure and month remain optional. Month choices roll across the next 24 months. A month records planning intent without claiming destination climate.

## Grouping and ranking

`public/discovery-groups.js` partitions an already ranked set. The top six remain **Best matches**. Optional groups use only eligible recommendations above a quality floor, with at least two suitable cards. Food and adventure/nature groups appear only when the traveller expresses those interests. Proximity groups require an actual selected country. A destination appears once, and remaining cards retain recommendation order under **More to explore**. Existing catalogue descriptions remain editorial drafts.

Optional inline follow-ups ask about food, near/far, relaxing/adventurous atmosphere and beaches. They are collapsible and dismissible for the current query. Nothing is assumed from `sunny` beyond the literal weather interest. Controls preserve semantic candidates and replace contextual ranking bonuses locally, avoiding a restart or an additional paid search. Explicit search submission retains the existing AI/keyword flow; provider interpretation tests use mocks.

## Limits

There is no sourced monthly destination climate model. Month affects activity recommendations only where an activity record has explicit sourced seasonal months/restrictions. Year-round opening is not ideal weather. No sunshine, affordability, flight duration or booking guarantees are implied.
