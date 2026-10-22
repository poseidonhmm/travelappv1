# Wanderly development workflow

- Work in this existing project and preserve completed work. Before starting or resuming, inspect Git status, recent commits, relevant diffs, project documentation and tests. After an interruption, continue from the current state rather than replacing it with an older copy.
- Implement changes in logical, reviewable stages. Run the relevant checks for each completed stage, then make a local Git commit. When separating existing changes into commits, test each staged snapshot so uncommitted files cannot hide missing dependencies.
- Run `npm test` and `npm run validate` before reporting completion. Use mocked AI providers in automated tests. Live AI is allowed when the user requests it; do not change or expose credentials to enable it.
- Do not push to GitHub, merge or deploy without the user's explicit approval. Local commits are authorized.
- Preserve the 288 existing destinations, saved-trip compatibility, feedback history, photo system and ignored local feedback, photo, embedding and activity-review files. Never stage `.env`, API keys or local caches.
- Keep activity and price evidence separate from user itinerary edits. Never invent prices, sources or manual approvals. Human review is the final approval step.
- Report implemented changes, validation results, local commit IDs and remaining limitations. Keep run and review instructions current.
