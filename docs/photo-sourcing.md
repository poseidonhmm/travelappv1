# Wanderly image sourcing: distinct photos for each destination

## Overview

The original prototype reused a few Unsplash stock photos across many destinations. This has been replaced with a **lazy destination-specific Wikimedia Commons photo discovery service**.

For each destination you view, the local Node server searches Wikimedia Commons by its name and country, fetches licensed image candidates and chooses up to **four distinct file images**.

- If a Commons image file or identical-content SHA-1 has been assigned to one place, the server will not assign it to another.
- The source, credited author and reported licence for each chosen image are shown under **Photo sources** beside the photo gallery.
- Files labelled as maps, flags, logos, drawings and diagrams are excluded.
- Images without a supported Commons licence or adequate resolution are excluded.
- If four acceptable, distinct photos cannot be found, the remaining slots show **Photo unavailable**; the site does not reuse photos from elsewhere.
- Thumbnail images on a single destination's detail page may repeat that destination's own four selected images; they are not reused for another destination.
- **The source location is not fact-checked**. Commons search results may be inaccurate or irrelevant. Confirm each photo really shows the destination before public use.

## Storage and backups

The photo choices are saved locally to:

    data/photo-cache.local.json

That file is ignored by Git because it is auto-generated and contains third-party image metadata. Photos themselves are hosted by Wikimedia Commons and loaded from that service, not copied into the repository. New photos are fetched only when the card enters the viewport; this avoids requesting 1,152 files at once.

The cache is loaded on server startup and is intended to keep images consistent across restarts. **Keep a backup of this local cache file before deleting or replacing your downloaded Wanderly folder**. The same applies to data/feedback.local.json and your private .env key.

Without internet access or when Wikimedia rate-limits requests, slots remain visibly blank rather than showing incorrect generic travel photographs.

## Limitations

- This is a candidate-photo collection system, **not** 1,152 manually verified and curated photos. Some places may have fewer than four accepted photos.
- Wikimedia Commons generally provides open-licence images but **each file has its own legal conditions**. Check attribution, licence, modifications and consent restrictions before publication. Photographs are visually cropped to fit the UI.
- This prototype caps simultaneous requests to Wikimedia Commons and caches results, but larger-scale production use should arrange durable media sourcing and comply with upstream rate limits.
- Attribution for each chosen image is available from the card's expandable **Photo sources** section.
- No API token or paid photo service is required.

Wikimedia references:
https://www.mediawiki.org/wiki/API:Imageinfo
https://www.mediawiki.org/wiki/Wikimedia_APIs/Content_reuse
https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines
