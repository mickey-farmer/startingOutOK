"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DirectoryEntry = {
  id: string;
  name: string;
  pronouns?: string;
  description?: string;
  location?: string;
  link?: string;
  contactLink?: string;
  contactLabel?: string;
  pills?: string[];
};

type DirectoryData = Record<string, DirectoryEntry[]>;

export default function CastDirectoryPage() {
  const [data, setData] = useState<DirectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/data/directory.json")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;

  const castList = (data?.Talent || [])
    .filter((entry) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const name = (entry.name || "").toLowerCase();
      const desc = (entry.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return (
    <div className="resources-page">
      <div className="resources-content">
        <div className="page-header">
          <h1>Cast directory</h1>
          <p>
            Actors in Oklahoma. Alphabetical list.
          </p>
          <p className="resources-submit-cta">
            To suggest someone for the directory,{" "}
            <Link href="/report-issue">let us know</Link>.
          </p>
        </div>

        <details className="filters-details">
          <summary className="filters-summary">Search</summary>
          <div className="filters-bar">
            <div className="filter-group">
              <label htmlFor="cast-search">Search by name or description</label>
              <input
                type="search"
                id="cast-search"
                placeholder="Name or description…"
                aria-label="Search cast by name or description"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="filter-reset"
              onClick={() => setSearch("")}
            >
              Reset
            </button>
          </div>
        </details>

        <section className="resources-section" aria-label="Cast">
          <div className="resource-grid" id="cast-container">
            {castList.map((entry) => (
              <Link
                key={entry.id}
                href={`/directory/cast/${entry.id}`}
                className="resource-card directory-card directory-card-link"
                data-id={entry.id}
              >
                <span className="directory-card-inner">
                  <h3>{entry.name}</h3>
                  {entry.pronouns && (
                    <p className="directory-pronouns">{entry.pronouns}</p>
                  )}
                  {entry.pills?.length ? (
                    <div className="resource-pills">
                      {entry.pills.map((p) => (
                        <span key={p} className="resource-pill">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {entry.location && (
                    <p className="resource-desc">
                      <strong>Location: {entry.location}</strong>
                    </p>
                  )}
                  {entry.description && (
                    <p className="resource-desc">{entry.description}</p>
                  )}
                  <div className="directory-links">
                    <span className="resource-link">View profile →</span>
                  </div>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {castList.length === 0 && (
          <p className="no-results">
            {search.trim()
              ? "No cast members match your search."
              : "No cast members in the directory yet."}
          </p>
        )}
      </div>
    </div>
  );
}
