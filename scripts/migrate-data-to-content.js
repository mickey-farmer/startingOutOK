#!/usr/bin/env node
/**
 * One-time migration: copy existing data/* into content/* for Decap CMS.
 * Run once before using Decap: node scripts/migrate-data-to-content.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const dataDir = path.join(ROOT, "data");
const contentDir = path.join(ROOT, "content");

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// Casting calls: copy each data/casting-calls/*.json to content/casting-calls/
// For list-only entries (no detail file), create a minimal content file so they appear in Decap
const castingListPath = path.join(dataDir, "casting-calls.json");
const castingList = readJson(castingListPath);
if (castingList && Array.isArray(castingList)) {
  const castingFolder = path.join(dataDir, "casting-calls");
  const contentCasting = path.join(contentDir, "casting-calls");
  for (const entry of castingList) {
    const slug = entry.slug || entry.title?.replace(/\s+/g, "-").toLowerCase();
    if (!slug) continue;
    const src = path.join(castingFolder, slug + ".json");
    const dest = path.join(contentCasting, slug + ".json");
    if (fs.existsSync(src)) {
      const full = readJson(src);
      if (full) writeJson(dest, { ...full, slug: full.slug || slug, id: full.id || slug });
    } else {
      writeJson(dest, {
        slug,
        id: slug,
        title: entry.title,
        date: entry.date,
        archived: true,
        auditionDeadline: entry.auditionDeadline || null,
        location: entry.location,
        pay: entry.pay,
        type: entry.type,
        union: entry.union,
        under18: !!entry.under18,
        roles: [],
      });
    }
  }
  console.log("Casting calls:", castingList.length, "→ content/casting-calls/");
}

// News: copy data/news/*.json to content/news/
const newsFolder = path.join(dataDir, "news");
if (fs.existsSync(newsFolder)) {
  const contentNews = path.join(contentDir, "news");
  const files = fs.readdirSync(newsFolder).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const src = path.join(newsFolder, f);
    const data = readJson(src);
    if (data) writeJson(path.join(contentNews, f), data);
  }
  console.log("News:", files.length, "→ content/news/");
}

// Resources: explode data/resources.json into content/resources/{id}.json
const resourcesPath = path.join(dataDir, "resources.json");
const resources = readJson(resourcesPath);
if (resources && typeof resources === "object") {
  const contentRes = path.join(contentDir, "resources");
  let count = 0;
  for (const [section, entries] of Object.entries(resources)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const id = entry.id || ("res-" + count);
      writeJson(path.join(contentRes, id + ".json"), { ...entry, section });
      count++;
    }
  }
  console.log("Resources:", count, "→ content/resources/");
}

// Spotlight: wrap array as { items: [...] } for Decap
const spotlightPath = path.join(dataDir, "spotlight.json");
const spotlight = readJson(spotlightPath);
if (Array.isArray(spotlight)) {
  writeJson(path.join(contentDir, "spotlight.json"), { items: spotlight });
  console.log("Spotlight → content/spotlight.json");
}

console.log("Migration done. Run: node scripts/build-from-content.js");
