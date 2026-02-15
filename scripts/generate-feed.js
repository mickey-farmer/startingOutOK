#!/usr/bin/env node
/**
 * Generates feed.xml (RSS 2.0) from data/news.json for use with Beehiv RSS-to-Send
 * or any RSS reader. Run from project root: node scripts/generate-feed.js
 *
 * Set SITE_BASE_URL when running, or edit the default below.
 * Example: SITE_BASE_URL=https://yoursite.com node scripts/generate-feed.js
 */

const fs = require("fs");
const path = require("path");

const SITE_BASE_URL =
  process.env.SITE_BASE_URL || "https://your-username.github.io/startingOutOK";
const FEED_TITLE = "Acting Out OK – News";
const FEED_DESCRIPTION =
  "Spotlights on actors, productions, and what's happening in the Oklahoma film community.";
const MAX_ITEMS = 20;

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(isoDate) {
  const d = new Date(isoDate);
  return d.toUTCString();
}

const dataPath = path.join(__dirname, "..", "data", "news.json");
const outPath = path.join(__dirname, "..", "feed.xml");

const raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const entries = Array.isArray(raw) ? raw : raw.items || [];
const filtered = entries.filter(
  (e) => e.deleted !== "yes" && e.deleted !== true
);
const sorted = filtered.sort((a, b) => {
  const da = a.date ? new Date(a.date).getTime() : 0;
  const db = b.date ? new Date(b.date).getTime() : 0;
  return db - da;
});
const items = sorted.slice(0, MAX_ITEMS);

const base = SITE_BASE_URL.replace(/\/$/, "");
const channelDate =
  items.length > 0 && items[0].date
    ? toRfc822(items[0].date)
    : new Date().toUTCString();

const itemXml = items
  .map((entry) => {
    const link = `${base}/news/article.html#${encodeURIComponent(entry.slug || entry.id || "")}`;
    const pubDate = entry.date ? toRfc822(entry.date) : channelDate;
    const guid = entry.id || link;
    const title = escapeXml(entry.title || "Untitled");
    const description = escapeXml(entry.excerpt || "");
    return `    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${channelDate}</lastBuildDate>
    <atom:link href="${escapeXml(base + "/feed.xml")}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>
`;

fs.writeFileSync(outPath, xml, "utf8");
console.log("Wrote " + outPath + " (" + items.length + " items)");
