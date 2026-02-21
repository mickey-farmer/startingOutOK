"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { sendContact, type ContactType, type ContactPayload } from "@/app/actions/send-contact";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAACd9D2mM-r32Oe4d";

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: "casting_call", label: "Casting Call request" },
  { value: "news", label: "News (submit a news story idea)" },
  { value: "resource", label: "Resource (suggest a resource or directory entry)" },
  { value: "report_issue", label: "Report an issue" },
  { value: "general", label: "General contact" },
];

const VALID_TYPES: ContactType[] = ["casting_call", "news", "resource", "report_issue", "general"];

function ContactFormInner() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const initialType: ContactType = useMemo(() => {
    if (typeParam && VALID_TYPES.includes(typeParam as ContactType)) return typeParam as ContactType;
    return "general";
  }, [typeParam]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<ContactType>(initialType);
  const [message, setMessage] = useState("");
  const [acceptTos, setAcceptTos] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);

  // Casting call
  const [casting_title, setCastingTitle] = useState("");
  const [casting_date, setCastingDate] = useState("");
  const [casting_audition_deadline, setCastingAuditionDeadline] = useState("");
  const [casting_description, setCastingDescription] = useState("");
  const [casting_location, setCastingLocation] = useState("");
  const [casting_director, setCastingDirector] = useState("");
  const [casting_filming_dates, setCastingFilmingDates] = useState("");
  const [casting_submission_details, setCastingSubmissionDetails] = useState("");
  const [casting_submission_link, setCastingSubmissionLink] = useState("");
  const [casting_source_link, setCastingSourceLink] = useState("");
  const [casting_under18, setCastingUnder18] = useState(false);
  const [casting_roles, setCastingRoles] = useState<Array<{ roleTitle: string; description: string; pay: string; ageRange: string; type: string; union: string; gender: string; ethnicity: string }>>([]);

  // News
  const [news_headline, setNewsHeadline] = useState("");
  const [news_story_description, setNewsStoryDescription] = useState("");
  const [news_source_url, setNewsSourceUrl] = useState("");
  const [news_type, setNewsType] = useState("");
  const [news_type_other, setNewsTypeOther] = useState("");

  // Resource
  const [resource_submit_type, setResourceSubmitType] = useState("resource");
  const [resource_section, setResourceSection] = useState("");
  const [resource_section_other, setResourceSectionOther] = useState("");
  const [resource_subcategory, setResourceSubcategory] = useState("");
  const [resource_title, setResourceTitle] = useState("");
  const [resource_type, setResourceType] = useState("");
  const [resource_description, setResourceDescription] = useState("");
  const [resource_location, setResourceLocation] = useState("");
  const [resource_link, setResourceLink] = useState("");
  const [resource_schedule, setResourceSchedule] = useState("");
  const [resource_notes, setResourceNotes] = useState("");
  const [directory_name, setDirectoryName] = useState("");
  const [directory_specialty, setDirectorySpecialty] = useState("");
  const [directory_description, setDirectoryDescription] = useState("");
  const [directory_location, setDirectoryLocation] = useState("");
  const [directory_imdb, setDirectoryImdb] = useState("");
  const [directory_contact_instagram, setDirectoryContactInstagram] = useState("");
  const [directory_contact_email, setDirectoryContactEmail] = useState("");
  const [directory_contact_other, setDirectoryContactOther] = useState("");

  // Report issue
  const [report_area, setReportArea] = useState("");
  const [report_area_other, setReportAreaOther] = useState("");
  const [report_description, setReportDescription] = useState("");

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  useEffect(() => {
    (window as unknown as { __turnstileCb?: (token: string) => void }).__turnstileCb = (token: string) => setTurnstileToken(token);
    return () => {
      delete (window as unknown as { __turnstileCb?: (token: string) => void }).__turnstileCb;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorText("");

    const payload: ContactPayload = {
      name: name.trim(),
      email: email.trim(),
      type,
      turnstileToken,
      acceptTos,
      message: type === "general" ? message.trim() : undefined,
      casting_title: type === "casting_call" ? casting_title : undefined,
      casting_date: type === "casting_call" ? casting_date : undefined,
      casting_audition_deadline: type === "casting_call" ? casting_audition_deadline : undefined,
      casting_description: type === "casting_call" ? casting_description : undefined,
      casting_location: type === "casting_call" ? casting_location : undefined,
      casting_director: type === "casting_call" ? casting_director : undefined,
      casting_filming_dates: type === "casting_call" ? casting_filming_dates : undefined,
      casting_submission_details: type === "casting_call" ? casting_submission_details : undefined,
      casting_submission_link: type === "casting_call" ? casting_submission_link : undefined,
      casting_source_link: type === "casting_call" ? casting_source_link : undefined,
      casting_under18: type === "casting_call" ? casting_under18 : undefined,
      casting_roles_json: type === "casting_call" && casting_roles.length > 0 ? JSON.stringify(casting_roles, null, 2) : undefined,
      news_headline: type === "news" ? news_headline : undefined,
      news_story_description: type === "news" ? news_story_description : undefined,
      news_source_url: type === "news" ? news_source_url : undefined,
      news_type: type === "news" ? news_type : undefined,
      news_type_other: type === "news" ? news_type_other : undefined,
      resource_submit_type: type === "resource" ? resource_submit_type : undefined,
      resource_section: type === "resource" ? resource_section : undefined,
      resource_section_other: type === "resource" ? resource_section_other : undefined,
      resource_subcategory: type === "resource" ? resource_subcategory : undefined,
      resource_title: type === "resource" ? resource_title : undefined,
      resource_type: type === "resource" ? resource_type : undefined,
      resource_description: type === "resource" ? resource_description : undefined,
      resource_location: type === "resource" ? resource_location : undefined,
      resource_link: type === "resource" ? resource_link : undefined,
      resource_schedule: type === "resource" ? resource_schedule : undefined,
      resource_notes: type === "resource" ? resource_notes : undefined,
      directory_name: type === "resource" ? directory_name : undefined,
      directory_specialty: type === "resource" ? directory_specialty : undefined,
      directory_description: type === "resource" ? directory_description : undefined,
      directory_location: type === "resource" ? directory_location : undefined,
      directory_imdb: type === "resource" ? directory_imdb : undefined,
      directory_contact_instagram: type === "resource" ? directory_contact_instagram : undefined,
      directory_contact_email: type === "resource" ? directory_contact_email : undefined,
      directory_contact_other: type === "resource" ? directory_contact_other : undefined,
      report_area: type === "report_issue" ? report_area : undefined,
      report_area_other: type === "report_issue" ? report_area_other : undefined,
      report_description: type === "report_issue" ? report_description : undefined,
    };

    const result = await sendContact(payload);
    if (result.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorText(result.error);
    }
  }

  if (status === "success") {
    return (
      <div className="form-page-main">
        <div className="page-header">
          <h1>Thanks!</h1>
          <p>Your message has been sent. We’ll get back to you when we can.</p>
        </div>
        <p><Link href="/">Back to home</Link></p>
      </div>
    );
  }

  return (
    <div className="form-page-main">
      <div className="page-header">
        <h1>Contact</h1>
        <p>Choose the type of request and fill out the form. All submissions go to Acting Out OK.</p>
      </div>

      <form className="submit-form" onSubmit={handleSubmit}>
        <div className="form-row two-cols">
          <div>
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </div>
          <div>
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="contact-type">Type</label>
          <select id="contact-type" value={type} onChange={(e) => setType(e.target.value as ContactType)} required>
            <option value="">Select…</option>
            {CONTACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {type === "general" && (
          <div className="form-row">
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message…" required />
          </div>
        )}

        {type === "casting_call" && (
          <CastingCallFields
            casting_title={casting_title}
            setCastingTitle={setCastingTitle}
            casting_date={casting_date}
            setCastingDate={setCastingDate}
            casting_audition_deadline={casting_audition_deadline}
            setCastingAuditionDeadline={setCastingAuditionDeadline}
            casting_description={casting_description}
            setCastingDescription={setCastingDescription}
            casting_location={casting_location}
            setCastingLocation={setCastingLocation}
            casting_director={casting_director}
            setCastingDirector={setCastingDirector}
            casting_filming_dates={casting_filming_dates}
            setCastingFilmingDates={setCastingFilmingDates}
            casting_submission_details={casting_submission_details}
            setCastingSubmissionDetails={setCastingSubmissionDetails}
            casting_submission_link={casting_submission_link}
            setCastingSubmissionLink={setCastingSubmissionLink}
            casting_source_link={casting_source_link}
            setCastingSourceLink={setCastingSourceLink}
            casting_under18={casting_under18}
            setCastingUnder18={setCastingUnder18}
            casting_roles={casting_roles}
            setCastingRoles={setCastingRoles}
          />
        )}

        {type === "news" && (
          <NewsFields
            news_headline={news_headline}
            setNewsHeadline={setNewsHeadline}
            news_story_description={news_story_description}
            setNewsStoryDescription={setNewsStoryDescription}
            news_source_url={news_source_url}
            setNewsSourceUrl={setNewsSourceUrl}
            news_type={news_type}
            setNewsType={setNewsType}
            news_type_other={news_type_other}
            setNewsTypeOther={setNewsTypeOther}
          />
        )}

        {type === "resource" && (
          <ResourceFields
            resource_submit_type={resource_submit_type}
            setResourceSubmitType={setResourceSubmitType}
            resource_section={resource_section}
            setResourceSection={setResourceSection}
            resource_section_other={resource_section_other}
            setResourceSectionOther={setResourceSectionOther}
            resource_subcategory={resource_subcategory}
            setResourceSubcategory={setResourceSubcategory}
            resource_title={resource_title}
            setResourceTitle={setResourceTitle}
            resource_type={resource_type}
            setResourceType={setResourceType}
            resource_description={resource_description}
            setResourceDescription={setResourceDescription}
            resource_location={resource_location}
            setResourceLocation={setResourceLocation}
            resource_link={resource_link}
            setResourceLink={setResourceLink}
            resource_schedule={resource_schedule}
            setResourceSchedule={setResourceSchedule}
            resource_notes={resource_notes}
            setResourceNotes={setResourceNotes}
            directory_name={directory_name}
            setDirectoryName={setDirectoryName}
            directory_specialty={directory_specialty}
            setDirectorySpecialty={setDirectorySpecialty}
            directory_description={directory_description}
            setDirectoryDescription={setDirectoryDescription}
            directory_location={directory_location}
            setDirectoryLocation={setDirectoryLocation}
            directory_imdb={directory_imdb}
            setDirectoryImdb={setDirectoryImdb}
            directory_contact_instagram={directory_contact_instagram}
            setDirectoryContactInstagram={setDirectoryContactInstagram}
            directory_contact_email={directory_contact_email}
            setDirectoryContactEmail={setDirectoryContactEmail}
            directory_contact_other={directory_contact_other}
            setDirectoryContactOther={setDirectoryContactOther}
          />
        )}

        {type === "report_issue" && (
          <ReportIssueFields
            report_area={report_area}
            setReportArea={setReportArea}
            report_area_other={report_area_other}
            setReportAreaOther={setReportAreaOther}
            report_description={report_description}
            setReportDescription={setReportDescription}
          />
        )}

        <div className="form-row form-row-tos">
          <label className="form-tos-label">
            <input type="checkbox" checked={acceptTos} onChange={(e) => setAcceptTos(e.target.checked)} required />
            {" "}I accept the <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link>.
          </label>
        </div>

        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
        <div className="form-row cf-turnstile-wrap">
          <div ref={turnstileRef} className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-callback="__turnstileCb" />
          <p className="form-hint">Complete the captcha so we know you’re not a bot.</p>
        </div>

        {status === "error" && (
          <div className="form-row">
            <p className="form-error" role="alert">{errorText}</p>
          </div>
        )}

        <div className="form-row form-actions">
          <button type="submit" className="form-submit-btn" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="form-page-main"><div className="page-header"><h1>Contact</h1><p>Loading…</p></div></div>}>
      <ContactFormInner />
    </Suspense>
  );
}

function CastingCallFields(props: {
  casting_title: string; setCastingTitle: (v: string) => void;
  casting_date: string; setCastingDate: (v: string) => void;
  casting_audition_deadline: string; setCastingAuditionDeadline: (v: string) => void;
  casting_description: string; setCastingDescription: (v: string) => void;
  casting_location: string; setCastingLocation: (v: string) => void;
  casting_director: string; setCastingDirector: (v: string) => void;
  casting_filming_dates: string; setCastingFilmingDates: (v: string) => void;
  casting_submission_details: string; setCastingSubmissionDetails: (v: string) => void;
  casting_submission_link: string; setCastingSubmissionLink: (v: string) => void;
  casting_source_link: string; setCastingSourceLink: (v: string) => void;
  casting_under18: boolean; setCastingUnder18: (v: boolean) => void;
  casting_roles: Array<{ roleTitle: string; description: string; pay: string; ageRange: string; type: string; union: string; gender: string; ethnicity: string }>;
  setCastingRoles: (v: typeof props.casting_roles) => void;
}) {
  const addRole = () => {
    props.setCastingRoles([...props.casting_roles, { roleTitle: "", description: "", pay: "", ageRange: "", type: "Short Film", union: "Non-Union", gender: "", ethnicity: "All ethnicities" }]);
  };
  const updateRole = (i: number, field: string, value: string) => {
    const next = [...props.casting_roles];
    (next[i] as Record<string, string>)[field] = value;
    props.setCastingRoles(next);
  };
  const removeRole = (i: number) => {
    props.setCastingRoles(props.casting_roles.filter((_, j) => j !== i));
  };
  return (
    <>
      <hr className="form-divider" aria-hidden />
      <div className="form-row">
        <label htmlFor="cc-title">Project title</label>
        <input id="cc-title" type="text" value={props.casting_title} onChange={(e) => props.setCastingTitle(e.target.value)} placeholder="e.g. Indie Feature – Oklahoma" required />
      </div>
      <div className="form-row two-cols">
        <div>
          <label htmlFor="cc-date">Date (YYYY-MM-DD)</label>
          <input id="cc-date" type="date" value={props.casting_date} onChange={(e) => props.setCastingDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="cc-deadline">Audition deadline</label>
          <input id="cc-deadline" type="date" value={props.casting_audition_deadline} onChange={(e) => props.setCastingAuditionDeadline(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="cc-description">Project description</label>
        <textarea id="cc-description" rows={2} value={props.casting_description} onChange={(e) => props.setCastingDescription(e.target.value)} placeholder="Brief project summary" />
      </div>
      <div className="form-row">
        <label htmlFor="cc-location">Location</label>
        <input id="cc-location" type="text" value={props.casting_location} onChange={(e) => props.setCastingLocation(e.target.value)} placeholder="e.g. Tulsa" />
      </div>
      <div className="form-row">
        <label htmlFor="cc-director">Director</label>
        <input id="cc-director" type="text" value={props.casting_director} onChange={(e) => props.setCastingDirector(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="cc-filming">Filming dates</label>
        <input id="cc-filming" type="text" value={props.casting_filming_dates} onChange={(e) => props.setCastingFilmingDates(e.target.value)} placeholder="e.g. March 15 – April 5, 2025" />
      </div>
      <div className="form-row">
        <label htmlFor="cc-submission-details">Submission details</label>
        <textarea id="cc-submission-details" rows={3} value={props.casting_submission_details} onChange={(e) => props.setCastingSubmissionDetails(e.target.value)} placeholder="How to submit, what to include" />
      </div>
      <div className="form-row">
        <label htmlFor="cc-submission-link">Submission / apply link</label>
        <input id="cc-submission-link" type="url" value={props.casting_submission_link} onChange={(e) => props.setCastingSubmissionLink(e.target.value)} placeholder="https://..." />
      </div>
      <div className="form-row">
        <label htmlFor="cc-source-link">Source link</label>
        <input id="cc-source-link" type="url" value={props.casting_source_link} onChange={(e) => props.setCastingSourceLink(e.target.value)} placeholder="https://..." />
      </div>
      <div className="form-row">
        <label>
          <input type="checkbox" checked={props.casting_under18} onChange={(e) => props.setCastingUnder18(e.target.checked)} />
          {" "}Under 18 / may involve minors
        </label>
      </div>
      <div className="form-row">
        <span className="form-label">Roles</span>
        {props.casting_roles.map((role, i) => (
          <div key={i} className="role-block">
            <div className="form-row">
              <input type="text" placeholder="Role title" value={role.roleTitle} onChange={(e) => updateRole(i, "roleTitle", e.target.value)} />
            </div>
            <div className="form-row">
              <input type="text" placeholder="Description" value={role.description} onChange={(e) => updateRole(i, "description", e.target.value)} />
            </div>
            <div className="form-row">
              <input type="text" placeholder="Pay" value={role.pay} onChange={(e) => updateRole(i, "pay", e.target.value)} />
            </div>
            <button type="button" className="role-block-remove" onClick={() => removeRole(i)}>Remove role</button>
          </div>
        ))}
        <button type="button" className="form-add-role" onClick={addRole}>Add role</button>
      </div>
    </>
  );
}

function NewsFields(props: {
  news_headline: string; setNewsHeadline: (v: string) => void;
  news_story_description: string; setNewsStoryDescription: (v: string) => void;
  news_source_url: string; setNewsSourceUrl: (v: string) => void;
  news_type: string; setNewsType: (v: string) => void;
  news_type_other: string; setNewsTypeOther: (v: string) => void;
}) {
  return (
    <>
      <hr className="form-divider" aria-hidden />
      <div className="form-row">
        <label htmlFor="news-headline">Headline</label>
        <input id="news-headline" type="text" value={props.news_headline} onChange={(e) => props.setNewsHeadline(e.target.value)} placeholder="Suggested headline" required />
      </div>
      <div className="form-row">
        <label htmlFor="news-description">Story description</label>
        <textarea id="news-description" rows={4} value={props.news_story_description} onChange={(e) => props.setNewsStoryDescription(e.target.value)} placeholder="Brief description and why it’s relevant to Oklahoma acting/film." required />
      </div>
      <div className="form-row">
        <label htmlFor="news-source">URL link to source</label>
        <input id="news-source" type="url" value={props.news_source_url} onChange={(e) => props.setNewsSourceUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="form-row">
        <label htmlFor="news-type">Type</label>
        <select id="news-type" value={props.news_type} onChange={(e) => props.setNewsType(e.target.value)} required>
          <option value="">Select type…</option>
          <option value="Breaking news">Breaking news</option>
          <option value="Feature">Feature</option>
          <option value="Interview">Interview</option>
          <option value="Event">Event</option>
          <option value="Casting Calls">Casting Calls</option>
          <option value="Other">Other</option>
        </select>
      </div>
      {props.news_type === "Other" && (
        <div className="form-row">
          <label htmlFor="news-type-other">Other (specify)</label>
          <input id="news-type-other" type="text" value={props.news_type_other} onChange={(e) => props.setNewsTypeOther(e.target.value)} placeholder="e.g. Industry update" />
        </div>
      )}
    </>
  );
}

function ResourceFields(props: {
  resource_submit_type: string; setResourceSubmitType: (v: string) => void;
  resource_section: string; setResourceSection: (v: string) => void;
  resource_section_other: string; setResourceSectionOther: (v: string) => void;
  resource_subcategory: string; setResourceSubcategory: (v: string) => void;
  resource_title: string; setResourceTitle: (v: string) => void;
  resource_type: string; setResourceType: (v: string) => void;
  resource_description: string; setResourceDescription: (v: string) => void;
  resource_location: string; setResourceLocation: (v: string) => void;
  resource_link: string; setResourceLink: (v: string) => void;
  resource_schedule: string; setResourceSchedule: (v: string) => void;
  resource_notes: string; setResourceNotes: (v: string) => void;
  directory_name: string; setDirectoryName: (v: string) => void;
  directory_specialty: string; setDirectorySpecialty: (v: string) => void;
  directory_description: string; setDirectoryDescription: (v: string) => void;
  directory_location: string; setDirectoryLocation: (v: string) => void;
  directory_imdb: string; setDirectoryImdb: (v: string) => void;
  directory_contact_instagram: string; setDirectoryContactInstagram: (v: string) => void;
  directory_contact_email: string; setDirectoryContactEmail: (v: string) => void;
  directory_contact_other: string; setDirectoryContactOther: (v: string) => void;
}) {
  const sections = ["Agencies", "Classes & Workshops", "Networking", "Photographers", "Props", "Studios & Sound Stages", "Stunts", "Theaters", "Vendors", "Voice", "Writing", "Other"];
  const isDirectory = props.resource_submit_type === "directory";
  return (
    <>
      <hr className="form-divider" aria-hidden />
      <div className="form-row">
        <span className="form-label">What are you submitting?</span>
        <label><input type="radio" name="resource_type" checked={props.resource_submit_type === "resource"} onChange={() => props.setResourceSubmitType("resource")} /> Resource (business, class, theater, etc.)</label>
        <label style={{ display: "block", marginTop: "0.25rem" }}><input type="radio" name="resource_type" checked={props.resource_submit_type === "directory"} onChange={() => props.setResourceSubmitType("directory")} /> Directory (a specific person)</label>
      </div>
      {!isDirectory && (
        <>
          <div className="form-row">
            <label htmlFor="res-section">Section</label>
            <select id="res-section" value={props.resource_section} onChange={(e) => props.setResourceSection(e.target.value)} required>
              <option value="">Select…</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {props.resource_section === "Other" && (
            <div className="form-row">
              <label htmlFor="res-section-other">Specify section</label>
              <input id="res-section-other" type="text" value={props.resource_section_other} onChange={(e) => props.setResourceSectionOther(e.target.value)} />
            </div>
          )}
          <div className="form-row">
            <label htmlFor="res-title">Name of resource / business</label>
            <input id="res-title" type="text" value={props.resource_title} onChange={(e) => props.setResourceTitle(e.target.value)} placeholder="e.g. OFA On-Camera Acting" required />
          </div>
          <div className="form-row">
            <label htmlFor="res-type">Type (optional)</label>
            <input id="res-type" type="text" value={props.resource_type} onChange={(e) => props.setResourceType(e.target.value)} placeholder="e.g. Class, Agency" />
          </div>
          <div className="form-row">
            <label htmlFor="res-description">Description</label>
            <textarea id="res-description" rows={4} value={props.resource_description} onChange={(e) => props.setResourceDescription(e.target.value)} placeholder="Brief description for the listing." />
          </div>
          <div className="form-row">
            <label htmlFor="res-location">Location</label>
            <input id="res-location" type="text" value={props.resource_location} onChange={(e) => props.setResourceLocation(e.target.value)} placeholder="e.g. Oklahoma City" />
          </div>
          <div className="form-row">
            <label htmlFor="res-link">Website or link</label>
            <input id="res-link" type="url" value={props.resource_link} onChange={(e) => props.setResourceLink(e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-row">
            <label htmlFor="res-schedule">Schedule (optional)</label>
            <input id="res-schedule" type="text" value={props.resource_schedule} onChange={(e) => props.setResourceSchedule(e.target.value)} placeholder="e.g. Monday-Thursday 6–9pm" />
          </div>
          <div className="form-row">
            <label htmlFor="res-notes">Additional notes or tags</label>
            <textarea id="res-notes" rows={2} value={props.resource_notes} onChange={(e) => props.setResourceNotes(e.target.value)} placeholder="e.g. Offers young adult classes" />
          </div>
        </>
      )}
      {isDirectory && (
        <>
          <div className="form-row">
            <label htmlFor="dir-name">Person’s full name</label>
            <input id="dir-name" type="text" value={props.directory_name} onChange={(e) => props.setDirectoryName(e.target.value)} placeholder="e.g. Jane Smith" />
          </div>
          <div className="form-row">
            <label htmlFor="dir-specialty">Specialty / category</label>
            <select id="dir-specialty" value={props.directory_specialty} onChange={(e) => props.setDirectorySpecialty(e.target.value)}>
              <option value="">Select…</option>
              <option value="Camera Operators">Camera Operators</option>
              <option value="Directors">Directors</option>
              <option value="Editors">Editors</option>
              <option value="PAs">PAs</option>
              <option value="Stunt Coordinators">Stunt Coordinators</option>
              <option value="Intimacy Coordinators">Intimacy Coordinators</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="dir-description">Description</label>
            <textarea id="dir-description" rows={3} value={props.directory_description} onChange={(e) => props.setDirectoryDescription(e.target.value)} placeholder="Brief description, credits, training." />
          </div>
          <div className="form-row">
            <label htmlFor="dir-location">Location</label>
            <input id="dir-location" type="text" value={props.directory_location} onChange={(e) => props.setDirectoryLocation(e.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="dir-imdb">IMDb link</label>
            <input id="dir-imdb" type="url" value={props.directory_imdb} onChange={(e) => props.setDirectoryImdb(e.target.value)} placeholder="https://www.imdb.com/name/nm..." />
          </div>
          <div className="form-row two-cols">
            <div>
              <label htmlFor="dir-ig">Instagram</label>
              <input id="dir-ig" type="url" value={props.directory_contact_instagram} onChange={(e) => props.setDirectoryContactInstagram(e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label htmlFor="dir-email">Email</label>
              <input id="dir-email" type="email" value={props.directory_contact_email} onChange={(e) => props.setDirectoryContactEmail(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="dir-other">Other contact</label>
            <input id="dir-other" type="text" value={props.directory_contact_other} onChange={(e) => props.setDirectoryContactOther(e.target.value)} placeholder="e.g. website, phone" />
          </div>
        </>
      )}
    </>
  );
}

function ReportIssueFields(props: {
  report_area: string; setReportArea: (v: string) => void;
  report_area_other: string; setReportAreaOther: (v: string) => void;
  report_description: string; setReportDescription: (v: string) => void;
}) {
  return (
    <>
      <hr className="form-divider" aria-hidden />
      <div className="form-row">
        <label htmlFor="report-area">Area</label>
        <select id="report-area" value={props.report_area} onChange={(e) => props.setReportArea(e.target.value)} required>
          <option value="">Select…</option>
          <option value="Website">Website</option>
          <option value="Casting Calls">Casting Calls</option>
          <option value="Resources">Resources</option>
          <option value="News">News</option>
          <option value="Other">Other</option>
        </select>
      </div>
      {props.report_area === "Other" && (
        <div className="form-row">
          <label htmlFor="report-area-other">Other (specify)</label>
          <input id="report-area-other" type="text" value={props.report_area_other} onChange={(e) => props.setReportAreaOther(e.target.value)} />
        </div>
      )}
      <div className="form-row">
        <label htmlFor="report-description">Describe the issue</label>
        <textarea id="report-description" rows={5} value={props.report_description} onChange={(e) => props.setReportDescription(e.target.value)} placeholder="What went wrong? Include page URL if relevant." required />
      </div>
    </>
  );
}
