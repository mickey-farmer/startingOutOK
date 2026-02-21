/**
 * Single source for directory, resources, and casting calls.
 * Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set;
 * otherwise reads from public/data/*.json (used by API routes).
 */

import { getSupabase, isSupabaseConfigured } from "./supabase/server";
import { readFileSync } from "fs";
import { join } from "path";

const PUBLIC_DATA = join(process.cwd(), "public", "data");

// ---- Directory (Cast + Crew) ------------------------------------------------

export type DirectoryData = Record<string, DirectoryEntry[]>;
export type DirectoryEntry = {
  id: string;
  name: string;
  pronouns?: string | null;
  description?: string | null;
  location?: string | null;
  link?: string | null;
  contactLink?: string | null;
  contactLabel?: string | null;
  pills?: string[];
  [key: string]: unknown;
};

export async function getDirectory(): Promise<DirectoryData> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const [castRes, crewRes] = await Promise.all([
      supabase.from("cast").select("*").order("name"),
      supabase.from("crew").select("*").order("sort_order").order("name"),
    ]);
    if (castRes.error) throw new Error(castRes.error.message);
    if (crewRes.error) throw new Error(crewRes.error.message);

    const talent = (castRes.data || []).map(rowToCastEntry);
    const bySection: Record<string, DirectoryEntry[]> = { Talent: talent };
    for (const row of crewRes.data || []) {
      const section = (row as { section: string }).section;
      if (!bySection[section]) bySection[section] = [];
      bySection[section].push(rowToCrewEntry(row as CrewRow));
    }
    return bySection;
  }

  const path = join(PUBLIC_DATA, "directory.json");
  const raw = JSON.parse(readFileSync(path, "utf-8")) as DirectoryData;
  return raw;
}

type CrewRow = {
  id: string;
  section: string;
  name: string;
  pronouns?: string | null;
  description?: string | null;
  location?: string | null;
  link?: string | null;
  contact_link?: string | null;
  contact_label?: string | null;
  pills?: string[] | null;
};

function rowToCrewEntry(row: CrewRow): DirectoryEntry {
  return {
    id: row.id,
    name: row.name,
    pronouns: row.pronouns ?? null,
    description: row.description ?? null,
    location: row.location ?? null,
    link: row.link ?? null,
    contactLink: row.contact_link ?? null,
    contactLabel: row.contact_label ?? null,
    pills: Array.isArray(row.pills) ? row.pills : undefined,
  };
}

type CastRow = {
  id: string;
  name: string;
  pronouns?: string | null;
  description?: string | null;
  location?: string | null;
  link?: string | null;
  contact_link?: string | null;
  contact_label?: string | null;
  email?: string | null;
  instagram?: string | null;
  other_links?: unknown;
  tmdb_person_id?: number | null;
  photo_url?: string | null;
  credits?: unknown;
};

function rowToCastEntry(row: CastRow): DirectoryEntry & { photoUrl?: string | null; tmdbPersonId?: number | null; credits?: unknown; otherLinks?: unknown; email?: string | null; instagram?: string | null } {
  return {
    id: row.id,
    name: row.name,
    pronouns: row.pronouns ?? null,
    description: row.description ?? null,
    location: row.location ?? null,
    link: row.link ?? null,
    contactLink: row.contact_link ?? null,
    contactLabel: row.contact_label ?? null,
    email: row.email ?? null,
    instagram: row.instagram ?? null,
    otherLinks: row.other_links ?? null,
    tmdbPersonId: row.tmdb_person_id ?? null,
    photoUrl: row.photo_url ?? null,
    credits: row.credits ?? null,
  };
}

// ---- Resources --------------------------------------------------------------

export type ResourcesData = Record<string, ResourceEntry[]>;
export type ResourceEntry = {
  id: string;
  title: string;
  section?: string;
  type?: string | null;
  subcategory?: string | null;
  description?: string | null;
  location?: string | null;
  link?: string | null;
  imdbLink?: string | null;
  vendor?: boolean;
  pills?: string[];
  schedule?: string | null;
};

export async function getResources(): Promise<ResourcesData> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("sort_order")
      .order("title");
    if (error) throw new Error(error.message);
    const bySection: ResourcesData = {};
    for (const row of data || []) {
      const r = row as { section: string; imdb_link?: string | null; [k: string]: unknown };
      const section = r.section;
      if (!bySection[section]) bySection[section] = [];
      bySection[section].push({
        id: r.id as string,
        title: r.title as string,
        section,
        type: (r.type as string) ?? null,
        subcategory: (r.subcategory as string) ?? null,
        description: (r.description as string) ?? null,
        location: (r.location as string) ?? null,
        link: (r.link as string) ?? null,
        imdbLink: r.imdb_link ?? null,
        vendor: (r.vendor as boolean) ?? false,
        pills: Array.isArray(r.pills) ? (r.pills as string[]) : undefined,
        schedule: (r.schedule as string) ?? null,
      });
    }
    return bySection;
  }

  const path = join(PUBLIC_DATA, "resources.json");
  return JSON.parse(readFileSync(path, "utf-8")) as ResourcesData;
}

// ---- Casting calls ----------------------------------------------------------

export type CastingListEntry = {
  slug: string;
  title: string;
  date: string | null;
  auditionDeadline: string | null;
  location: string | null;
  pay: string | null;
  type: string | null;
  union: string | null;
  under18: boolean;
  roleCount: number;
  archived?: boolean;
};

export type CastingCallDetail = {
  slug: string;
  title: string;
  date?: string | null;
  auditionDeadline?: string | null;
  location?: string | null;
  director?: string | null;
  filmingDates?: string | null;
  description?: string | null;
  submissionDetails?: string | null;
  sourceLink?: string | null;
  exclusive?: boolean;
  under18?: boolean;
  roles?: Array<{
    roleTitle?: string;
    description?: string;
    pay?: string;
    ageRange?: string;
    type?: string;
    union?: string;
    gender?: string;
    ethnicity?: string;
  }>;
};

export type CastingCallsListResult =
  | { data: CastingListEntry[]; source: "supabase" }
  | { data: CastingListEntry[]; source: "json" };

export async function getCastingCallsList(): Promise<CastingCallsListResult> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("casting_calls")
      .select("slug, title, date, audition_deadline, location, pay, type, union_status, under18, role_count, archived")
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    const list = (data || []).map((row: Record<string, unknown>) => ({
      slug: row.slug as string,
      title: row.title as string,
      date: row.date as string | null,
      auditionDeadline: row.audition_deadline as string | null,
      location: row.location as string | null,
      pay: row.pay as string | null,
      type: row.type as string | null,
      union: row.union_status as string | null,
      under18: (row.under18 as boolean) ?? false,
      roleCount: (row.role_count as number) ?? 0,
      archived: (row.archived as boolean) ?? false,
    }));
    return { data: list, source: "supabase" };
  }

  const path = join(PUBLIC_DATA, "casting-calls.json");
  const raw = JSON.parse(readFileSync(path, "utf-8")) as CastingListEntry[];
  const list = Array.isArray(raw) ? raw : [];
  return { data: list, source: "json" };
}

export async function getCastingCallBySlug(slug: string): Promise<CastingCallDetail | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("casting_calls")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      slug: row.slug as string,
      title: row.title as string,
      date: row.date as string | null,
      auditionDeadline: row.audition_deadline as string | null,
      location: row.location as string | null,
      director: row.director as string | null,
      filmingDates: row.filming_dates as string | null,
      description: row.description as string | null,
      submissionDetails: row.submission_details as string | null,
      sourceLink: row.source_link as string | null,
      exclusive: (row.exclusive as boolean) ?? false,
      under18: (row.under18 as boolean) ?? false,
      roles: (row.roles as CastingCallDetail["roles"]) ?? [],
    };
  }

  const path = join(PUBLIC_DATA, "casting-calls", `${slug}.json`);
  try {
    const raw = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
    return {
      slug: raw.slug as string,
      title: raw.title as string,
      date: raw.date as string | null,
      auditionDeadline: (raw.auditionDeadline ?? raw.audition_deadline ?? null) as string | null,
      location: raw.location as string | null,
      director: raw.director as string | null,
      filmingDates: (raw.filmingDates ?? raw.filming_dates ?? null) as string | null,
      description: raw.description as string | null,
      submissionDetails: (raw.submissionDetails ?? raw.submission_details ?? null) as string | null,
      sourceLink: (raw.sourceLink ?? raw.source_link ?? null) as string | null,
      exclusive: (raw.exclusive as boolean) ?? false,
      under18: (raw.under18 as boolean) ?? false,
      roles: (raw.roles as CastingCallDetail["roles"]) ?? [],
    };
  } catch {
    return null;
  }
}
