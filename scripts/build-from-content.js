#!/usr/bin/env node
/**
 * Builds data/* from content/* for the live site.
 * Run after pulling Decap CMS edits: node scripts/build-from-content.js
 *
 * - content/casting-calls/*.json → data/casting-calls/{slug}.json + data/casting-calls.json (list)
 * - content/news/*.json → data/news/{slug}.json + data/news.json (list)
 * - content/resources/*.json → data/resources.json (grouped by section)
 * - content/spotlight.json → data/spotlight.json (array)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const contentDir = path.join(ROOT, "content");
const dataDir = path.join(ROOT, "data");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.warn("Skip or invalid JSON:", filePath, e.message);
    return null;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function safeSlug(name) {
  return (name || "")
    .replace(/\.json$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";
}

// ----- Casting calls -----
function buildCastingCalls() {
  const folder = path.join(contentDir, "casting-calls");
  if (!fs.existsSync(folder)) return;
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".json"));
  const entries = [];
  for (const file of files) {
    const slug = safeSlug(path.basename(file, ".json"));
    const full = readJson(path.join(folder, file));
    if (!full || typeof full !== "object") continue;
    const obj = { ...full };
    if (!obj.slug) obj.slug = slug;
    if (!obj.id) obj.id = obj.slug;
    writeJson(path.join(dataDir, "casting-calls", slug + ".json"), obj);
    const firstRole = Array.isArray(obj.roles) && obj.roles[0] ? obj.roles[0] : null;
    entries.push({
      slug: obj.slug,
      title: obj.title,
      date: obj.date,
      auditionDeadline: obj.auditionDeadline ?? null,
      location: obj.location,
      pay: firstRole?.pay ?? obj.pay,
      type: firstRole?.type ?? obj.type,
      union: firstRole?.union ?? obj.union,
      under18: !!obj.under18,
      roleCount: Array.isArray(obj.roles) ? obj.roles.length : 1,
      ...(obj.archived && { archived: true }),
    });
  }
  entries.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  writeJson(path.join(dataDir, "casting-calls.json"), entries);
  console.log("Casting calls:", entries.length);
}

// ----- News -----
function buildNews() {
  const folder = path.join(contentDir, "news");
  if (!fs.existsSync(folder)) return;
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".json"));
  const list = [];
  for (const file of files) {
    const slug = safeSlug(path.basename(file, ".json"));
    const full = readJson(path.join(folder, file));
    if (!full || typeof full !== "object") continue;
    const obj = { ...full };
    if (!obj.slug) obj.slug = slug;
    writeJson(path.join(dataDir, "news", slug + ".json"), obj);
    list.push({
      id: obj.id || obj.slug,
      date: obj.date,
      title: obj.title,
      excerpt: obj.excerpt,
      slug: obj.slug,
    });
  }
  list.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  writeJson(path.join(dataDir, "news.json"), list);
  console.log("News:", list.length);
}

// ----- Resources -----
function buildResources() {
  const folder = path.join(contentDir, "resources");
  if (!fs.existsSync(folder)) return;
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".json"));
  const bySection = {};
  for (const file of files) {
    const full = readJson(path.join(folder, file));
    if (!full || typeof full !== "object" || !full.section) continue;
    const section = full.section;
    const entry = { ...full };
    delete entry.section;
    if (Array.isArray(entry.pills)) {
      entry.pills = entry.pills.map((p) => (typeof p === "string" ? p : p?.value ?? ""));
    }
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(entry);
  }
  const sectionOrder = [
    "Agencies", "Casting", "Classes & Workshops", "Networking", "Photographers",
    "Props", "Stunts", "Studios & Sound Stages", "Theaters", "Vendors", "Voice", "Writing",
  ];
  const out = {};
  for (const section of sectionOrder) {
    if (bySection[section]?.length) {
      bySection[section].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      out[section] = bySection[section];
    }
  }
  for (const section of Object.keys(bySection)) {
    if (!out[section]) out[section] = bySection[section];
  }
  writeJson(path.join(dataDir, "resources.json"), out);
  console.log("Resources:", Object.values(out).flat().length);
}

// ----- Directory (crew & specialists by specialty) -----
// Each entry can list in multiple sections via "sections" array (or legacy "section").
function buildDirectory() {
  const folder = path.join(contentDir, "directory");
  if (!fs.existsSync(folder)) return;
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".json"));
  const bySection = {};
  for (const file of files) {
    const full = readJson(path.join(folder, file));
    if (!full || typeof full !== "object") continue;
    if (full.deleted === "yes" || full.deleted === true) continue;
    // Support "sections" (array) or legacy "section" (single)
    const rawSections = full.sections != null
      ? full.sections
      : (full.section != null ? [full.section] : []);
    const sections = Array.isArray(rawSections)
      ? rawSections.map((s) => (typeof s === "string" ? s : s?.value ?? "")).filter(Boolean)
      : [];
    if (sections.length === 0) continue;
    const entry = { ...full };
    delete entry.section;
    delete entry.sections;
    if (Array.isArray(entry.pills)) {
      entry.pills = entry.pills.map((p) => (typeof p === "string" ? p : p?.value ?? ""));
    }
    sections.forEach((section) => {
      if (!bySection[section]) bySection[section] = [];
      bySection[section].push({ ...entry });
    });
  }
  const sectionOrder = [
    "Camera Operators", "Costume", "Directors", "Editors", "Gaffer", "Grips",
    "Hair & Make-Up", "Intimacy Coordinators", "PAs", "Photographers", "Production Design",
    "Props", "Script Supervisor", "Sound", "Stunt Coordinators", "Talent", "Writers",
  ];
  const out = {};
  for (const section of sectionOrder) {
    if (bySection[section]?.length) {
      bySection[section].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      out[section] = bySection[section];
    }
  }
  for (const section of Object.keys(bySection)) {
    if (!out[section]) out[section] = bySection[section];
  }
  writeJson(path.join(dataDir, "directory.json"), out);
  console.log("Directory:", Object.values(out).flat().length);
}

// ----- Spotlight -----
function buildSpotlight() {
  const file = path.join(contentDir, "spotlight.json");
  if (!fs.existsSync(file)) return;
  const data = readJson(file);
  if (!data) return;
  const arr = Array.isArray(data) ? data : data.items || [];
  writeJson(path.join(dataDir, "spotlight.json"), arr);
  console.log("Spotlight:", arr.length);
}

// Run
buildCastingCalls();
buildNews();
buildResources();
buildDirectory();
buildSpotlight();
console.log("Done. data/ is ready for the site.");
