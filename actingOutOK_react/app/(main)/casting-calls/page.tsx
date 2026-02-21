"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CastingEntry = {
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

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDeadline(iso: string | null) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isExpiringWithinWeek(entry: CastingEntry) {
  const deadline = entry.auditionDeadline;
  if (!deadline) return false;
  const deadlineTime = new Date(deadline + "T23:59:59").getTime();
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;
  return deadlineTime >= todayStart && deadlineTime <= weekEnd;
}

function isArchived(entry: CastingEntry) {
  return entry.archived === true || entry.archived === (true as unknown);
}

export default function CastingCallsPage() {
  const [list, setList] = useState<CastingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/casting-calls")
      .then((r) => r.json())
      .then((data: CastingEntry[]) => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const active = list.filter((e) => !isArchived(e));
  const archivedList = list.filter(isArchived);
  const expiring = active.filter(isExpiringWithinWeek);

  return (
    <>
      <div className="page-header">
        <h1>Casting Calls</h1>
        <p>
          Find auditions and opportunities across Oklahoma. Sourced from around
          the web and exclusive listings.
        </p>
        <p className="casting-public-note">
          We only list publicly announced casting calls and do not republish
          exclusives or subscriber-only listings from platforms such as Actors
          Access, Backstage, or similar services.
        </p>
        <p className="casting-submit-cta">
          To have your casting call added to Acting Out OK,{" "}
          <Link href="/submit-casting">submit your request</Link>.
        </p>
      </div>

      <div
        className="casting-tabs"
        role="tablist"
        aria-label="Casting call views"
      >
        <button type="button" role="tab" aria-selected aria-controls="panel-all">
          All
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          aria-controls="panel-expiring"
        >
          Expiring Soon ({expiring.length})
        </button>
      </div>

      <div id="panel-all" role="tabpanel" aria-labelledby="tab-all">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="casting-grid" id="casting-grid">
            {active.map((entry) => (
              <article
                key={entry.slug}
                className="casting-list-card"
                data-id={entry.slug}
              >
                <Link
                  href={`/casting-call/${encodeURIComponent(entry.slug)}`}
                  className="casting-list-card-link"
                >
                  <h3>{entry.title}</h3>
                  {entry.auditionDeadline && (
                    <p className="casting-deadline casting-list-deadline">
                      <strong>Audition by:</strong>{" "}
                      {formatDeadline(entry.auditionDeadline)}
                    </p>
                  )}
                  <div className="casting-list-meta">
                    {entry.date && (
                      <time dateTime={entry.date}>
                        Posted {formatDate(entry.date)}
                      </time>
                    )}
                    {entry.location && <span>📍 {entry.location}</span>}
                    {entry.pay && <span>💰 {entry.pay}</span>}
                    {entry.type && <span>{entry.type}</span>}
                    {entry.roleCount ? (
                      <span>
                        {entry.roleCount} role{entry.roleCount !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`casting-pill ${
                      entry.union === "Union"
                        ? "casting-pill--union"
                        : entry.union === "Non-Union"
                          ? "casting-pill--nonunion"
                          : "casting-pill--mixed"
                    }`}
                  >
                    {entry.union || "Non-Union"}
                  </span>
                  {entry.under18 && (
                    <span className="casting-pill casting-pill--under18">
                      Under 18
                    </span>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
        {!loading && active.length === 0 && (
          <p className="no-results" id="no-results">
            No casting calls match your filters.
          </p>
        )}
      </div>

      {archivedList.length > 0 && (
        <section
          className="casting-archived-section"
          id="archived-section"
          aria-label="Archived casting calls"
        >
          <details className="casting-archived-details">
            <summary className="casting-archived-summary" id="archived-summary">
              Archived ({archivedList.length})
            </summary>
            <ul
              className="casting-archived-list"
              aria-label="Archived casting call titles"
            >
              {archivedList.map((entry) => (
                <li key={entry.slug} className="casting-archived-item">
                  <Link href={`/casting-call/${encodeURIComponent(entry.slug)}`}>
                    {entry.title}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </>
  );
}
