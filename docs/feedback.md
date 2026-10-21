# Collecting search feedback in Wanderly

A private, **free-to-use** recommendation feedback feature is built into the existing website.

## Try it

1. Update to the latest Wanderly project, then run npm run dev.
2. Open http://localhost:3000 in Chrome.
3. Type a search and click Find my escape (this AI search incurs normal API charges, if configured).
4. On any returned destination card, click **👍 Good match** or **👎 Not right**.
5. For negative ratings, choose a reason and optionally type an explanation, then press Save feedback.
6. Click **Feedback** in the top navigation to review your ratings and **Export feedback as JSON**.

A rating is saved to the local Node.js server as JSON in:

    data/feedback.local.json

This file is ignored by Git, to avoid publishing your raw search history and feedback in your public GitHub repository. The file persists across restarts **as long as you keep the same project folder**. Export JSON and keep a backup before replacing your downloaded project folder with a new ZIP.

Ratings are unique for the combination of query, region, scenery/vibe filter selections, search engine and destination. Changing a rating for the same situation updates the existing record instead of creating a duplicate.

### Cost

- **Thumbs-up/down, reason notes, Feedback review and JSON export make zero OpenAI API requests**. They have no extra model cost.
- Running a new AI search makes model calls (one query interpretation plus embeddings). The initial search after starting the Node server computes a batch of 288 destination embeddings.
- **Identical queries plus identical filters are cached in memory while the local server is running**, so repeating them does not cause new paid calls. The cache holds up to 80 recent searches and is reset on restart.
- Browsing the existing results and adding feedback never reruns AI.
- Using ChatGPT to discuss the findings does not store ratings in your local Wanderly project. Export a JSON file or share a non-secret sample when you want analysis here.

### Important

Feedback is **training/evaluation data for a future ranking system**, not automatic learning. The live Wanderly ranking will not change until we analyse the feedback and update ranking logic or train a model. A thumbs-down rating means "wrong for this query," not "this destination is universally bad."

Run npm test to check the local feedback store and UI endpoint tests.
