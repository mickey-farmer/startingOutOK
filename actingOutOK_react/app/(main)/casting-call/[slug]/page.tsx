"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type CastingCallDetail = {
  slug: string;
  title: string;
  date?: string;
  auditionDeadline?: string;
  location?: string;
  director?: string;
  filmingDates?: string;
  description?: string;
  submissionDetails?: string;
  sourceLink?: string;
  exclusive?: boolean;
  under18?: boolean;
  roles?: Array<{
    roleTitle?: string;
    description?: string;
    ageRange?: string;
    gender?: string;
    pay?: string;
    type?: string;
    union?: string;
  }>;
};

function formatDate(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CastingCallPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [entry, setEntry] = useState<CastingCallDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    fetch(`/api/data/casting-calls/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setEntry)
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p>Loading…</p>;
  if (!entry) {
    return (
      <div className="page-header">
        <h1>Casting Call</h1>
        <p>Not found.</p>
        <Link href="/casting-calls">Back to Casting Calls</Link>
      </div>
    );
  }

  return (
    <article className="prose">
      <div className="page-header">
        <h1>{entry.title}</h1>
        {entry.auditionDeadline && (
          <p className="casting-deadline">
            <strong>Audition by:</strong>{" "}
            {formatDate(entry.auditionDeadline)}
          </p>
        )}
        {entry.date && (
          <p>
            <time dateTime={entry.date}>Posted {formatDate(entry.date)}</time>
          </p>
        )}
        {entry.location && <p>📍 {entry.location}</p>}
        {entry.filmingDates && (
          <p>
            <strong>Filming:</strong> {entry.filmingDates}
          </p>
        )}
      </div>
      {entry.description && (
        <div
          className="casting-description"
          dangerouslySetInnerHTML={{ __html: entry.description }}
        />
      )}
      {entry.roles && entry.roles.length > 0 && (
        <section aria-label="Roles">
          <h2>Roles</h2>
          <ul>
            {entry.roles.map((role, i) => (
              <li key={i}>
                <strong>{role.roleTitle}</strong>
                {role.ageRange && ` (${role.ageRange})`}
                {role.description && (
                  <p className="casting-role-desc">{role.description}</p>
                )}
                {role.pay && <span>Pay: {role.pay}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {entry.submissionDetails && (
        <section>
          <h2>Submission details</h2>
          <div
            dangerouslySetInnerHTML={{ __html: entry.submissionDetails }}
          />
        </section>
      )}
      {entry.sourceLink && (
        <p>
          <a
            href={entry.sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            Source / Apply ↗
          </a>
        </p>
      )}
      <p>
        <Link href="/casting-calls">← Back to Casting Calls</Link>
      </p>
    </article>
  );
}
