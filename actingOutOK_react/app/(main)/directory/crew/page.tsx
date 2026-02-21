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

const CREW_SECTION_ORDER = [
  "Camera Operators",
  "Costume",
  "Directors",
  "Editors",
  "Gaffer",
  "Grips",
  "Hair & Make-Up",
  "Intimacy Coordinators",
  "PAs",
  "Photographers",
  "Production Design",
  "Props",
  "Script Supervisor",
  "Sound",
  "Stunt Coordinators",
  "Writers",
];

function sectionId(section: string) {
  return (
    "section-" +
    (section || "")
      .toLowerCase()
      .replace(/\s*&\s*/g, "-")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

export default function CrewDirectoryPage() {
  const [data, setData] = useState<DirectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/data/directory")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const matchesFilter = (entry: DirectoryEntry, section: string) => {
    if (!q) return true;
    const name = (entry.name || "").toLowerCase();
    const desc = (entry.description || "").toLowerCase();
    const sec = (section || "").toLowerCase();
    return (
      name.includes(q) || desc.includes(q) || sec.includes(q)
    );
  };

  if (loading) return <p>Loading…</p>;

  const sections = data
    ? CREW_SECTION_ORDER.filter((s) => data[s]?.length)
    : [];
  let hasVisible = false;

  return (
    <div className="resources-page">
      <div className="resources-content">
        <div className="page-header">
          <h1>Crew directory</h1>
          <p>
            Crew and specialists in Oklahoma: intimacy coordinators, directors,
            grips, camera operators, editors, PAs, hair &amp; makeup, and more. You
            can find more crew{" "}
            <a
              href="https://www.okfilmmusic.org/productiondirectory"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>
            .
          </p>
          <p className="resources-submit-cta">
            To suggest someone for the directory,{" "}
            <Link href="/report-issue">let us know</Link>.
          </p>
        </div>

        <details className="filters-details">
          <summary className="filters-summary">Filters</summary>
          <div className="filters-bar">
            <div className="filter-group">
              <label htmlFor="directory-search">Search</label>
              <input
                type="search"
                id="directory-search"
                placeholder="Name, description, or section…"
                aria-label="Search directory by name, description, or section"
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
              Reset filters
            </button>
          </div>
        </details>

        <div id="directory-container">
          {sections.map((section) => {
            const list = (data![section] || []).filter((entry) =>
              matchesFilter(entry, section)
            );
            if (list.length === 0) return null;
            hasVisible = true;
            const sorted = [...list].sort((a, b) =>
              (a.name || "").localeCompare(b.name || "")
            );
            return (
              <section
                key={section}
                className="resources-section"
                id={sectionId(section)}
                aria-label={section}
              >
                <details className="resources-section-details" open>
                  <summary className="resources-section-summary">
                    <span className="resources-section-summary-text">
                      {section}{" "}
                      <span className="resources-section-count">
                        ({list.length})
                      </span>
                    </span>
                  </summary>
                  <div className="resources-section-content">
                    <div className="resource-grid">
                      {sorted.map((entry) => (
                        <article
                          key={entry.id}
                          className="resource-card directory-card"
                          data-id={entry.id}
                        >
                          <h3>{entry.name}</h3>
                          {entry.pronouns && (
                            <p className="directory-pronouns">
                              {entry.pronouns}
                            </p>
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
                            {entry.link && (
                              <a
                                href={entry.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="resource-link"
                              >
                                {entry.link.includes("imdb.com") ? "IMDb" : "Profile"}
                              </a>
                            )}
                            {entry.contactLink && (
                              <a
                                href={entry.contactLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="resource-link"
                              >
                                {entry.contactLabel || "Contact"}
                              </a>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </details>
              </section>
            );
          })}
        </div>
        {!hasVisible && (
          <p className="no-results" id="directory-no-results">
            {search.trim()
              ? "No directory entries match your search or filters."
              : "No directory entries match your filters."}
          </p>
        )}
      </div>
    </div>
  );
}
