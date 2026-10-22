# Wanderly: local AI semantic search

The existing mobile-first website now supports real AI-powered natural-language interpretation and destination retrieval. The source catalogue was subsequently expanded from 88 to 288 editorial drafts.

## Steps on your Mac

If you have already cloned the project to `~/Documents/Wanderly` and stored your OpenAI API key in its local `.env` file:

1. Stop the running server with Control + C.
2. Run `cd ~/Documents/Wanderly`, then `git pull`, then `npm run dev`.
3. Open http://localhost:3000 and try your search.

You **do not** need to create another `.env` file, re-enter a working API key, or buy new credits just to apply code updates. Your `.env`, feedback and cached photo data stay in place because Git ignores them.

If setting up a new clone for the first time, get an API key from https://platform.openai.com/api-keys, add your own API billing, and put `OPENAI_API_KEY=...` in a local `.env` file. ChatGPT subscriptions and API billing are separate. Never paste your key into chat or GitHub.

## How it works

1. The local Node server sends only the search description to gpt-4o-mini using the OpenAI Responses API with structured JSON output.
2. The server embeds the rewritten travel intent and the 288 existing destination profiles using text-embedding-3-small.
3. It computes cosine similarity and gives modest boosts for selected scenery/vibe filters.
4. Region filtering is strict, results are selected only by existing database IDs, and explanations cite the existing draft themes (not imagined attractions).
5. The website visibly identifies whether it is displaying AI semantic matches or fallback keyword/tag matches.

Destination embeddings are generated in batches of up to 64, and each completed batch is persisted to `data/embeddings.local.json` on your Mac. On the next restart, unchanged destination embeddings are loaded from this local file without paying to generate them again. Changed profiles are re-embedded individually or in small batches. The private cache file is excluded from Git; back it up before replacing the whole project folder. Initial indexing may take longer than an ordinary search. OpenAI requests now have a 90-second timeout; completed embedding batches are retained even if a later batch fails. Every **new** AI query still uses one intent call and one query-embedding call; identical searches are reused in memory while the server is running. Model requests incur API charges. No live web search or booking API is used.

## Safeguards and current limits

- The server binds to localhost (127.0.0.1), not a public interface.
- The secret never appears in the client JavaScript, HTML or search responses.
- A search input is restricted to 400 characters, filters are validated, and a rate limit allows up to 20 searches per minute on this local server.
- API failures, missing credentials, quota errors and network issues cause explicit fallback to tag search; it must not claim AI ran.
- Results are limited to existing destinations. Draft text and imagery still require research and rights review.
- Weather, climate, prices, flights, accommodation and availability are NOT verified, even when the search mentions them.
- Do not expose this local server on a public network or deploy it as-is before adding production authentication, rate limits, credential management, observability and data review.

## Diagnosing AI fallback after a successful search

If `/api/status` says `{"aiConfigured":true}`, the local project **found** an API key, but that does not guarantee every provider request will succeed. Click **Find my escape**, check the visible fallback message, and check Terminal for an `AI search unavailable:` line.

- `credit_balance_exhausted` or `insufficient_quota`: inspect **API** prepaid credits at https://platform.openai.com/settings/organization/billing/overview. ChatGPT credits are separate.
- `project_spend_limit_exceeded`, `organization_spend_limit_exceeded`, or `organization_usage_limit_exceeded`: review project/organisation spending and usage controls in the OpenAI Platform dashboard.
- `rate_limit_exceeded` (HTTP 429): a temporary requests-per-minute or tokens-per-minute limit can be reached even with positive prepaid credit. Slow your test queries and consult your API model/project limits; repeatedly retrying immediately can make the limit worse.
- HTTP 401 or 403: check API key/project permissions.
- Generic provider/network failure: inspect the Terminal message before assuming it is a credit issue.

The backend logs only HTTP status, provider error code and endpoint, and the UI shows a sanitised diagnostic. The API key is never printed. These diagnostics are included after the October 2026 code update.

## Checks

Run npm test and npm run validate inside the repository. Unit tests use a simulated API response and are not billed.

API documentation:
https://platform.openai.com/docs/api-reference/responses/create
https://platform.openai.com/docs/api-reference/embeddings/create
