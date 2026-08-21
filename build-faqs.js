/**
 * build-faqs.js
 *
 * Runs after build-meta.js as part of `npm run build` (see package.json /
 * vercel.json — build-meta.js must run first, since this script edits the
 * copy of index.html it produces in dist/). Reads the Faq collection
 * straight from MongoDB — active entries only, sorted by order — and
 * rewrites everything between <!-- FAQ:START --> and <!-- FAQ:END --> in
 * dist/index.html with:
 *   - the visible FAQ accordion (a .faq-list of <details> elements)
 *   - a matching FAQPage JSON-LD <script> tag for search engines
 *
 * If MONGODB_URI is missing, or there are no active FAQs, the block
 * between the markers is left exactly as copied — the static content
 * already in index.html is the fallback.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DIST_INDEX = path.join(__dirname, 'dist', 'index.html');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// JSON-LD lives inside a <script> tag, which is not HTML-entity-decoded by
// browsers — so HTML-escaping the text before JSON.stringify would ship
// literal "&amp;" into the schema. Only guard against "</script>" breaking
// out of the tag early.
function escapeForScriptTag(json) {
  return json.replace(/</g, '\\u003c');
}

function renderFaqBlock(faqs) {
  const items = faqs
    .map(
      (f, i) =>
        `    <details class="faq-item"${i === 0 ? ' open' : ''}><summary>${escapeHtml(f.question)}</summary><p>${escapeHtml(
          f.answer
        )}</p></details>`
    )
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return [
    '  <div class="faq-list">',
    items,
    '  </div>',
    '  <script type="application/ld+json">',
    escapeForScriptTag(JSON.stringify(jsonLd, null, 2)),
    '  </script>',
  ].join('\n');
}

async function main() {
  if (!fs.existsSync(DIST_INDEX)) {
    console.warn('[build-faqs] dist/index.html not found — run build-meta.js first. Skipping.');
    return;
  }

  if (!MONGODB_URI) {
    console.warn('[build-faqs] MONGODB_URI not set — skipping FAQ injection, static fallback content will be used.');
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const faqs = await db.collection('faqs').find({ isActive: true }).sort({ order: 1, createdAt: 1 }).toArray();

    console.log(`[build-faqs] Fetched ${faqs.length} active FAQ${faqs.length === 1 ? '' : 's'}.`);

    if (!faqs.length) {
      console.warn('[build-faqs] No active FAQs in the database — leaving the static fallback FAQ block untouched.');
      return;
    }

    const html = fs.readFileSync(DIST_INDEX, 'utf8');
    const re = /(<!--\s*FAQ:START\s*-->)([\s\S]*?)(<!--\s*FAQ:END\s*-->)/i;

    if (!re.test(html)) {
      console.warn('[build-faqs] No <!-- FAQ:START --> / <!-- FAQ:END --> markers found in dist/index.html — skipping.');
      return;
    }

    const next = html.replace(re, (_m, start, _old, end) => `${start}\n${renderFaqBlock(faqs)}\n  ${end}`);
    fs.writeFileSync(DIST_INDEX, next, 'utf8');
    console.log(`[build-faqs] Injected ${faqs.length} FAQ(s) and FAQPage JSON-LD into dist/index.html.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  // Never fail the whole Vercel deploy over a FAQ hiccup — worst case the
  // fallback content already in dist/ ships instead.
  console.error('[build-faqs] Failed, continuing with existing HTML content:', err.message);
});
