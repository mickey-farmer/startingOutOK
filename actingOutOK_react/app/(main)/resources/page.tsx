"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ResourceEntry = {
  id: string;
  title: string;
  section?: string;
  type?: string;
  description?: string;
  location?: string;
  link?: string;
  imdbLink?: string;
  pills?: string[];
  schedule?: string;
};

type ResourcesData = Record<string, ResourceEntry[]>;

const SECTION_ORDER = [
  "Agencies",
  "Casting",
  "Classes & Workshops",
  "Networking",
  "Photographers",
  "Props",
  "Studios & Sound Stages",
  "Stunts",
  "Theaters",
  "Vendors",
  "Voice",
  "Writing",
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

export default function ResourcesPage() {
  const [data, setData] = useState<ResourcesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/resources")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;

  const sections = data
    ? SECTION_ORDER.filter((s) => data[s]?.length)
    : [];

  return (
    <div className="resources-page">
      <div className="resources-content">
      <div className="page-header">
        <h1>Resources</h1>
        <p>
          Classes, agencies, theaters, photographers, and more to help you get
          started in Oklahoma.
        </p>
        <p className="resources-submit-cta">
          To suggest a resource, <Link href="/report-issue">let us know</Link>.
        </p>
      </div>

      <div id="resources-container">
        {sections.map((section) => {
          const list = data![section] || [];
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
                    <span className="resources-section-count">({list.length})</span>
                  </span>
                </summary>
                <div className="resources-section-content">
                  <div className="resource-grid">
                    {list.map((entry) => (
                      <article
                        key={entry.id}
                        className="resource-card"
                        data-id={entry.id}
                      >
                        <h3>{entry.title}</h3>
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
                            <strong>📍 {entry.location}</strong>
                          </p>
                        )}
                        {entry.description && (
                          <p className="resource-desc">{entry.description}</p>
                        )}
                        <div className="directory-links">
                          {entry.imdbLink && (
                            <a
                              href={entry.imdbLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="resource-link"
                            >
                              IMDb ↗
                            </a>
                          )}
                          {entry.link && (
                            <a
                              href={entry.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="resource-link"
                            >
                              Learn more ↗
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
      </div>
    </div>
  );
}
