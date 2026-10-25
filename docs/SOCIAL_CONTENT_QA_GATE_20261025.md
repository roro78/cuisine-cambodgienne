# Editorial QA — Gate after PR #123

A dry-run preview on actual catalogue records showed these regressions despite successful CI:

- Kroeung (ingredient): an unnecessary instruction `Émincer très finement avant de piler` after a useful aroma description.
- Amok Trey (recipe): two full recipe instructions copied into the captions instead of a short culinary introduction.
- Rice (culture): grammatically incorrect `Derrière Le riz...` and section headings pasted into posts.
- Duplicates: `fresh=!p||p.fingerprint!==s.fingerprint` marked already published sources as "new" after an image, article, or social-fact change.

Changes:
- `socialCatalog.ts` feeds descriptions and culinary context rather than entire recipe steps; for culture, extracts complete first sentences rather than headings and long passages. Original articles unchanged.
- n8n source selector treats a `source_id` already present in publication history as already seen even if its fingerprint changes. New sources remain prioritized.
- Deterministic fallback and bounded AI reject very short headings or huge excerpts and use at most 2 factual blocks (1 for cultural stories).
- Culture headline templates no longer concatenate "Derrière" and an article title with a leading definite article.
- Migration accepts only the exact existing installed workflow 01 nodes, with fail-closed checks. **No n8n runtime writes in this PR.**

**Pre-release:** regenerate JPEGs, check visual crop of Kroeung / Amok / culture, validate the final three captions on mobile, deploy static assets to OVH manually, then authorize n8n GET-only dry-run before `--apply`. Nothing in GitHub updates the live n8n runtime, user-posted Facebook/Instagram items, or PostgreSQL.
