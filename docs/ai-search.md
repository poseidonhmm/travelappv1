# Wanderly: local AI semantic search

The existing mobile-first website now supports real AI-powered natural-language interpretation and destination retrieval. The source catalogue was subsequently expanded from 88 to 288 editorial drafts.

## Steps on your Mac

1. Download the latest GitHub ZIP again, or (if cloned with Git) run: git pull
2. Get an API key from https://platform.openai.com/api-keys and enable API billing. ChatGPT subscriptions and API billing are separate.
3. In Terminal, cd into the updated travelappv1-main folder.
4. Run: cp .env.example .env
5. Run: open -e .env
6. Paste the key after OPENAI_API_KEY= in the newly opened file, save it and close the editor.
7. Run: npm run dev
8. Open http://localhost:3000 in Chrome. Type a natural-language travel request and click Find my escape.

Never paste your key into chat, Codex messages, GitHub, a browser console or any publicly shared file. The real .env file is ignored by Git, while .env.example deliberately contains no key.

## How it works

1. The local Node server sends only the search description to gpt-4o-mini using the OpenAI Responses API with structured JSON output.
2. The server embeds the rewritten travel intent and the 288 existing destination profiles using text-embedding-3-small.
3. It computes cosine similarity and gives modest boosts for selected scenery/vibe filters.
4. Region filtering is strict, results are selected only by existing database IDs, and explanations cite the existing draft themes (not imagined attractions).
5. The website visibly identifies whether it is displaying AI semantic matches or fallback keyword/tag matches.

The full 288-destination embedding catalogue is cached in server memory once per server process (and will be regenerated on a restart). Every subsequent AI query still uses one interpreter call and one query-embedding call. The model requests incur API charges. No live web search or booking API is used.

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
