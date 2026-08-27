/**
 * build-meta.js
 *
 * Runs as part of the Vercel build (see vercel.json). It:
 *   1. Copies the static site's assets into dist/ — this becomes the
 *      deployed output, so build tooling (node_modules, package.json,
 *      this script itself) and the backend (server/) never ship to Vercel.
 *   2. Reads the PageMeta collection straight from MongoDB and rewrites
 *      the <title>, <meta name="description">, <link rel="canonical">,
 *      and <meta property="og:image"> tags in each matching HTML file
 *      inside dist/, so the values search engines crawl come from the
 *      database instead of a client-side script.
 *
 * Matching is done via marker comments placed immediately before the tag
 * they control, e.g.:
 *
 *   <!-- SEO:TITLE --><title>Fallback title</title>
 *   <!-- SEO:DESCRIPTION --><meta name="description" content="Fallback description">
 *   <!-- SEO:CANONICAL --><link rel="canonical" href="https://example.com/">
 *   <!-- SEO:OG_IMAGE --><meta property="og:image" content="https://example.com/og.jpg">
 *
 * A page with no marker, or a pagePath with no matching PageMeta document
 * (or MONGODB_URI missing entirely), is left exactly as copied — the
 * HTML's existing tag content is the fallback the task asked for.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Everything the deployed site needs. Add new top-level HTML pages,
// folders, or files here — anything not listed stays out of the deploy.
const ASSETS = ['index.html', 'about', 'academics', 'admission', 'student-life', 'facilities', 'rules-and-regulations', 'gallery', 'contact', 'careers', 'news-events', 'results', 'alumni', 'placements', 'downloads', 'style.css', 'script.js', 'config.js', 'images', 'videos', 'admin-panel'];

function resetDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function copyAssets() {
  for (const name of ASSETS) {
    const src = path.join(ROOT, name);
    if (!fs.existsSync(src)) {
      console.warn(`[build-meta] Expected asset "${name}" not found at repo root — skipping.`);
      continue;
    }
    fs.cpSync(src, path.join(DIST, name), { recursive: true });
  }
  console.log(`[build-meta] Copied ${ASSETS.length} asset(s) into dist/.`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Replaces the text content of <!-- SEO:TITLE --><title>...</title>
function setTitle(html, value) {
  if (!value) return html;
  const re = /(<!--\s*SEO:TITLE\s*-->\s*<title>)([\s\S]*?)(<\/title>)/i;
  if (!re.test(html)) return html;
  return html.replace(re, (_m, pre, _old, post) => pre + escapeHtml(value) + post);
}

// Replaces one attribute's value on the void tag immediately following a
// <!-- SEO:MARKER --> comment, regardless of attribute order in the tag.
function setTagAttr(html, marker, attr, value) {
  if (!value) return html;
  const markerRe = new RegExp(`(<!--\\s*SEO:${marker}\\s*-->\\s*)(<[^>]*>)`, 'i');
  if (!markerRe.test(html)) return html;

  return html.replace(markerRe, (_m, prefix, tag) => {
    const escaped = escapeHtml(value);
    const attrRe = new RegExp(`(${attr}\\s*=\\s*["'])([^"']*)(["'])`, 'i');
    const newTag = attrRe.test(tag)
      ? tag.replace(attrRe, (_m2, p1, _old, p3) => p1 + escaped + p3)
      : tag.replace(/\/?>\s*$/, (end) => ` ${attr}="${escaped}"${end}`);
    return prefix + newTag;
  });
}

function applyMeta(html, meta) {
  let out = html;
  out = setTitle(out, meta.title);
  out = setTagAttr(out, 'DESCRIPTION', 'content', meta.metaDescription);
  out = setTagAttr(out, 'CANONICAL', 'href', meta.canonicalUrl);
  out = setTagAttr(out, 'OG_IMAGE', 'content', meta.ogImage);
  return out;
}

async function injectSeoMeta() {
  if (!MONGODB_URI) {
    console.warn('[build-meta] MONGODB_URI not set — skipping SEO injection, HTML fallback content will be used.');
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const entries = await db.collection('pagemetas').find({}).toArray();
    console.log(`[build-meta] Fetched ${entries.length} PageMeta entr${entries.length === 1 ? 'y' : 'ies'}.`);

    let updated = 0;
    let skipped = 0;

    for (const meta of entries) {
      const filePath = path.join(DIST, meta.pagePath);

      if (!fs.existsSync(filePath)) {
        console.warn(`[build-meta] No HTML file at "${meta.pagePath}" — skipping.`);
        skipped += 1;
        continue;
      }

      const html = fs.readFileSync(filePath, 'utf8');
      const next = applyMeta(html, meta);

      if (next !== html) {
        fs.writeFileSync(filePath, next, 'utf8');
        updated += 1;
        console.log(`[build-meta] Updated SEO tags in ${meta.pagePath}`);
      } else {
        console.log(`[build-meta] No marker tags found (or nothing changed) in ${meta.pagePath}`);
      }
    }

    console.log(`[build-meta] Done. ${updated} file(s) updated, ${skipped} skipped (no matching HTML file).`);
  } finally {
    await client.close();
  }
}

async function main() {
  resetDist();
  copyAssets();
  await injectSeoMeta();
}

main().catch((err) => {
  // Never fail the whole Vercel deploy over a metadata hiccup — worst case
  // the fallback content already copied into dist/ ships instead.
  console.error('[build-meta] Failed, continuing with existing HTML content:', err.message);
});
