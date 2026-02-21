#!/usr/bin/env node
/**
 * One-time seed: read public/data/*.json and insert into Supabase.
 * Run from repo root: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicData = join(root, "public", "data");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

// ---- Cast ----
function toCastRow(entry) {
  return {
    id: entry.id,
    name: entry.name,
    pronouns: entry.pronouns ?? null,
    description: entry.description ?? null,
    location: entry.location ?? null,
    link: entry.link ?? null,
    contact_link: entry.contactLink ?? null,
    contact_label: entry.contactLabel ?? null,
    email: entry.email ?? null,
    instagram: entry.instagram ?? null,
    other_links: entry.otherLinks ?? [],
    tmdb_person_id: entry.tmdbPersonId ?? null,
    photo_url: entry.photoUrl ?? null,
    credits: entry.credits ?? {},
  };
}

// ---- Crew ----
function toCrewRow(section, entry) {
  return {
    id: entry.id,
    section,
    name: entry.name,
    pronouns: entry.pronouns ?? null,
    description: entry.description ?? null,
    location: entry.location ?? null,
    link: entry.link ?? null,
    contact_link: entry.contactLink ?? null,
    contact_label: entry.contactLabel ?? null,
    pills: entry.pills ?? [],
  };
}

// ---- Resources ----
function toResourceRow(section, entry) {
  return {
    id: entry.id,
    section,
    title: entry.title,
    type: entry.type ?? null,
    subcategory: entry.subcategory ?? null,
    description: entry.description ?? null,
    location: entry.location ?? null,
    link: entry.link ?? null,
    imdb_link: entry.imdbLink ?? null,
    vendor: entry.vendor ?? false,
    pills: entry.pills ?? [],
    schedule: entry.schedule ?? null,
  };
}

// ---- Casting calls ----
function toCastingRow(detail) {
  const roles = detail.roles ?? [];
  return {
    slug: detail.slug,
    title: detail.title,
    date: detail.date || null,
    audition_deadline: detail.auditionDeadline ?? detail.audition_deadline ?? null,
    location: detail.location ?? null,
    pay: detail.pay ?? (roles[0]?.pay) ?? null,
    type: roles[0]?.type ?? null,
    union_status: roles[0]?.union ?? detail.union ?? null,
    under18: detail.under18 ?? false,
    role_count: roles.length,
    archived: detail.archived ?? false,
    description: detail.description ?? null,
    director: detail.director ?? null,
    filming_dates: detail.filmingDates ?? detail.filming_dates ?? null,
    submission_details: detail.submissionDetails ?? detail.submission_details ?? null,
    source_link: detail.sourceLink ?? detail.source_link ?? null,
    exclusive: detail.exclusive ?? false,
    roles,
  };
}

async function main() {
  console.log("Seeding Supabase from public/data/...");

  const directoryPath = join(publicData, "directory.json");
  const directory = readJson(directoryPath);
  const talent = directory.Talent ?? [];
  const { error: delCast } = await supabase.from("cast").delete().neq("id", "");
  if (delCast) throw new Error(`cast delete: ${delCast.message}`);
  if (talent.length > 0) {
    const { error } = await supabase.from("cast").insert(talent.map(toCastRow));
    if (error) throw new Error(`cast: ${error.message}`);
    console.log(`  cast: ${talent.length} rows`);
  }
  const crewEntries = [];
  for (const [section, entries] of Object.entries(directory)) {
    if (section === "Talent" || !Array.isArray(entries)) continue;
    for (const e of entries) crewEntries.push({ section, entry: e });
  }
  const { error: delCrew } = await supabase.from("crew").delete().neq("id", "");
  if (delCrew) throw new Error(`crew delete: ${delCrew.message}`);
  if (crewEntries.length > 0) {
    const { error } = await supabase.from("crew").insert(crewEntries.map(({ section, entry }) => toCrewRow(section, entry)));
    if (error) throw new Error(`crew: ${error.message}`);
    console.log(`  crew: ${crewEntries.length} rows`);
  }

  const resourcesPath = join(publicData, "resources.json");
  const resources = readJson(resourcesPath);
  const resourceRows = [];
  for (const [section, entries] of Object.entries(resources)) {
    if (!Array.isArray(entries)) continue;
    for (const e of entries) resourceRows.push(toResourceRow(section, e));
  }
  const { error: delRes } = await supabase.from("resources").delete().neq("id", "");
  if (delRes) throw new Error(`resources delete: ${delRes.message}`);
  if (resourceRows.length > 0) {
    const { error } = await supabase.from("resources").insert(resourceRows);
    if (error) throw new Error(`resources: ${error.message}`);
    console.log(`  resources: ${resourceRows.length} rows`);
  }

  const listPath = join(publicData, "casting-calls.json");
  const list = readJson(listPath);
  const castingDir = join(publicData, "casting-calls");
  const castingRows = [];
  for (const item of Array.isArray(list) ? list : []) {
    const slug = item.slug;
    let detail;
    try {
      detail = readJson(join(castingDir, `${slug}.json`));
    } catch {
      detail = {
        slug: item.slug,
        title: item.title,
        date: item.date,
        auditionDeadline: item.auditionDeadline,
        location: item.location,
        under18: item.under18,
        archived: item.archived,
        roles: [],
      };
    }
    castingRows.push(toCastingRow({ ...detail, archived: item.archived ?? detail.archived }));
  }
  if (castingRows.length > 0) {
    const { error } = await supabase.from("casting_calls").upsert(castingRows, { onConflict: "slug" });
    if (error) throw new Error(`casting_calls: ${error.message}`);
    console.log(`  casting_calls: ${castingRows.length} rows`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
