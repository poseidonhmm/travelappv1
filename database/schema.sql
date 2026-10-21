-- Future PostgreSQL / Supabase persistence schema.
-- JSON catalogue remains the primary prototype source until facts are reviewed.
create table if not exists destinations (
 id text primary key,
 name text not null,
 country text not null,
 macro_region text not null,
 kind text not null,
 summary text not null,
 latitude double precision check (latitude between -90 and 90),
 longitude double precision check (longitude between -180 and 180),
 wikidata_id text unique,
 geo_verified_at timestamptz,
 editorial_status text not null default 'draft' check (editorial_status in ('draft','reviewed','published')),
 reviewed_at timestamptz,
 updated_at timestamptz not null default now(),
 constraint published_requires_review check (editorial_status <> 'published' or reviewed_at is not null)
);
create table if not exists destination_tags (
 destination_id text not null references destinations(id) on delete cascade,
 category text not null check (category in ('scenery','vibe','experiences','food')),
 tag text not null,
 primary key (destination_id,category,tag)
);
create table if not exists destination_sources (
 id bigint generated always as identity primary key,
 destination_id text not null references destinations(id) on delete cascade,
 source_url text not null,
 source_title text,
 accessed_at timestamptz not null default now(),
 supports_claim text,
 license text
);
create table if not exists destination_facts (
 id bigint generated always as identity primary key,
 destination_id text not null references destinations(id) on delete cascade,
 fact_type text not null,
 fact_value jsonb not null,
 source_id bigint references destination_sources(id),
 verified_at timestamptz,
 valid_from date,
 valid_until date,
 review_status text not null default 'draft' check (review_status in ('draft','verified','rejected')),
 constraint verified_fact_requires_source check (review_status <> 'verified' or (source_id is not null and verified_at is not null))
);
create table if not exists destination_media (
 id bigint generated always as identity primary key,
 destination_id text not null references destinations(id) on delete cascade,
 asset_url text not null,
 media_type text not null check (media_type in ('image','video-thumbnail')),
 creator text,
 license text,
 attribution text,
 original_source_url text,
 rights_reviewed_at timestamptz,
 is_approved boolean not null default false,
 constraint approved_media_requires_license check (not is_approved or (license is not null and original_source_url is not null and rights_reviewed_at is not null))
);
-- Enforce source-backed publishing in application code / DB trigger before public exposure.
-- This schema does NOT itself assert that sources support each individual claim.
