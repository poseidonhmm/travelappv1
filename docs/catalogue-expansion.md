# Catalogue expansion: 200 additional draft destinations

The destination database now contains **288 profiles**: 88 original seeds and exactly 200 newly authored profiles.

Breakdown of added records:
- Europe: 48
- Asia: 50
- Africa: 25
- Middle East: 15
- North America: 25
- South America: 20
- Oceania: 17

The new profiles span cities, historic towns, islands and archipelagos, coastal regions, mountain and desert environments, and wildlife/nature areas. They emphasise different moods and use cases for Wanderly's creative semantic search: food culture, romance, laid-back social trips, active adventures, quiet seclusion and scenery.

## Important editorial caveat

These are **human-directed editorial drafts** for a private search prototype. They are *not* a set of 200 independently fact-checked research reports. This release deliberately does not add guessed latitude/longitude, IDs, climate months or prices; sources and review dates remain unset. The controlled taxonomy was extended with a few concrete tags.

Some destinations contain overlapping geographic scales (for example, an island and a specific town on the island). This can be useful for trip intent but will require hierarchical parent-child grouping and deduplicated ranking later.

## Next recommended checks

1. Run npm run validate and npm test.
2. Search a mix of nuanced combinations and collect 👍/👎 feedback.
3. Spot-check travel descriptions against official destination/heritage sources, especially safety-sensitive activities and less familiar places.
4. Check candidate photo locations, licences and author attribution.
5. Refine the taxonomy to capture nuances like classic vs adventurous romance, casual nightlife vs clubbing, luxury stays, working/longer stays and the accessibility of outdoor experiences.
6. Keep weather suitability, booking availability and affordability separate from editorial impressions.

The additions do not incur API charges by themselves; AI queries generate embeddings from the expanded catalogue on the first AI search in each server session.
