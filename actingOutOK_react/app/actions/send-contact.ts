"use server";

import { Resend } from "resend";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "mickey@mickeyonstage.com";
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "Acting Out OK <onboarding@resend.dev>";
const TURNSTILE_SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type ContactType =
  | "casting_call"
  | "news"
  | "resource"
  | "report_issue"
  | "general";

export type ContactPayload = {
  name: string;
  email: string;
  type: ContactType;
  turnstileToken: string;
  acceptTos: boolean;
  message?: string;
  // Casting call
  casting_title?: string;
  casting_date?: string;
  casting_audition_deadline?: string;
  casting_description?: string;
  casting_location?: string;
  casting_director?: string;
  casting_filming_dates?: string;
  casting_submission_details?: string;
  casting_submission_link?: string;
  casting_source_link?: string;
  casting_under18?: boolean;
  casting_roles_json?: string;
  // News
  news_headline?: string;
  news_story_description?: string;
  news_source_url?: string;
  news_type?: string;
  news_type_other?: string;
  // Resource
  resource_submit_type?: string;
  resource_section?: string;
  resource_section_other?: string;
  resource_subcategory?: string;
  resource_title?: string;
  resource_type?: string;
  resource_description?: string;
  resource_location?: string;
  resource_link?: string;
  resource_schedule?: string;
  resource_notes?: string;
  directory_name?: string;
  directory_specialty?: string;
  directory_description?: string;
  directory_location?: string;
  directory_imdb?: string;
  directory_contact_instagram?: string;
  directory_contact_email?: string;
  directory_contact_other?: string;
  // Report issue
  report_area?: string;
  report_area_other?: string;
  report_description?: string;
};

function buildEmailBody(p: ContactPayload): string {
  const lines: string[] = [];
  lines.push(`From: ${p.name} <${p.email}>`);
  lines.push(`Type: ${p.type}`);
  lines.push("");

  if (p.type === "general" && p.message) {
    lines.push("Message:");
    lines.push(p.message);
    return lines.join("\n");
  }

  if (p.type === "casting_call") {
    lines.push("--- Casting Call Request ---");
    if (p.casting_title) lines.push(`Title: ${p.casting_title}`);
    if (p.casting_date) lines.push(`Date: ${p.casting_date}`);
    if (p.casting_audition_deadline) lines.push(`Audition deadline: ${p.casting_audition_deadline}`);
    if (p.casting_description) lines.push(`Description: ${p.casting_description}`);
    if (p.casting_location) lines.push(`Location: ${p.casting_location}`);
    if (p.casting_director) lines.push(`Director: ${p.casting_director}`);
    if (p.casting_filming_dates) lines.push(`Filming dates: ${p.casting_filming_dates}`);
    if (p.casting_submission_details) lines.push(`Submission details: ${p.casting_submission_details}`);
    if (p.casting_submission_link) lines.push(`Submission link: ${p.casting_submission_link}`);
    if (p.casting_source_link) lines.push(`Source link: ${p.casting_source_link}`);
    if (p.casting_under18) lines.push("Under 18 / may involve minors: Yes");
    if (p.casting_roles_json) lines.push(`Roles (JSON):\n${p.casting_roles_json}`);
  }

  if (p.type === "news") {
    lines.push("--- News Story Suggestion ---");
    if (p.news_headline) lines.push(`Headline: ${p.news_headline}`);
    if (p.news_story_description) lines.push(`Story description: ${p.news_story_description}`);
    if (p.news_source_url) lines.push(`Source URL: ${p.news_source_url}`);
    if (p.news_type) lines.push(`Type: ${p.news_type}`);
    if (p.news_type_other) lines.push(`Other type: ${p.news_type_other}`);
  }

  if (p.type === "resource") {
    lines.push("--- Resource / Directory Submission ---");
    if (p.resource_submit_type) lines.push(`Submit as: ${p.resource_submit_type}`);
    if (p.resource_section) lines.push(`Section: ${p.resource_section}`);
    if (p.resource_section_other) lines.push(`Section other: ${p.resource_section_other}`);
    if (p.resource_subcategory) lines.push(`Subcategory: ${p.resource_subcategory}`);
    if (p.resource_title) lines.push(`Title: ${p.resource_title}`);
    if (p.resource_type) lines.push(`Type: ${p.resource_type}`);
    if (p.resource_description) lines.push(`Description: ${p.resource_description}`);
    if (p.resource_location) lines.push(`Location: ${p.resource_location}`);
    if (p.resource_link) lines.push(`Link: ${p.resource_link}`);
    if (p.resource_schedule) lines.push(`Schedule: ${p.resource_schedule}`);
    if (p.resource_notes) lines.push(`Notes: ${p.resource_notes}`);
    if (p.directory_name) lines.push(`Directory - Name: ${p.directory_name}`);
    if (p.directory_specialty) lines.push(`Directory - Specialty: ${p.directory_specialty}`);
    if (p.directory_description) lines.push(`Directory - Description: ${p.directory_description}`);
    if (p.directory_location) lines.push(`Directory - Location: ${p.directory_location}`);
    if (p.directory_imdb) lines.push(`Directory - IMDb: ${p.directory_imdb}`);
    if (p.directory_contact_instagram) lines.push(`Directory - Instagram: ${p.directory_contact_instagram}`);
    if (p.directory_contact_email) lines.push(`Directory - Email: ${p.directory_contact_email}`);
    if (p.directory_contact_other) lines.push(`Directory - Other contact: ${p.directory_contact_other}`);
  }

  if (p.type === "report_issue") {
    lines.push("--- Report an Issue ---");
    if (p.report_area) lines.push(`Area: ${p.report_area}`);
    if (p.report_area_other) lines.push(`Area other: ${p.report_area_other}`);
    if (p.report_description) lines.push(`Description: ${p.report_description}`);
  }

  return lines.join("\n");
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  const res = await fetch(TURNSTILE_SITEVERIFY, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export async function sendContact(payload: ContactPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!payload.acceptTos) {
    return { ok: false, error: "You must accept the Terms of Service." };
  }
  if (!payload.name?.trim()) {
    return { ok: false, error: "Name is required." };
  }
  if (!payload.email?.trim()) {
    return { ok: false, error: "Email is required." };
  }
  if (!payload.turnstileToken?.trim()) {
    return { ok: false, error: "Please complete the captcha." };
  }

  const verified = await verifyTurnstile(payload.turnstileToken);
  if (!verified) {
    return { ok: false, error: "Captcha verification failed. Please try again." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Submissions are not configured. Please try again later." };
  }

  const { turnstileToken: _t, acceptTos: _a, ...rest } = payload;
  const dbPayload = rest as Record<string, unknown>;

  const supabase = getSupabase();
  const { error: insertError } = await supabase.from("contact_submissions").insert({
    name: payload.name.trim(),
    email: payload.email.trim(),
    type: payload.type,
    payload: dbPayload,
  });

  if (insertError) {
    console.error("Contact submission insert error:", insertError);
    return { ok: false, error: "Failed to save submission. Please try again." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Email is not configured. Please try again later." };
  }

  const subject = `Acting Out OK – ${payload.type.replace(/_/g, " ")} from ${payload.name}`;
  const body = buildEmailBody(payload);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to: CONTACT_EMAIL,
    replyTo: payload.email,
    subject,
    text: body,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to send." };
  }
  return { ok: true };
}
