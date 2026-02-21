"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CastEntry, CreditsByCategory, CreditRow } from "@/lib/cast-types";

type DirectoryData = Record<string, CastEntry[]>;

type TmdbPerson = {
  personId: number;
  imdbId: string;
  details: Record<string, unknown> | null;
  imageUrl: string | null;
  movieCredits: { cast?: { title: string; character?: string; release_date?: string }[]; crew?: unknown[] };
  tvCredits: { cast?: { name: string; character?: string; first_air_date?: string }[] };
};

function parseImdbId(link: string): string | null {
  const match = (link || "").match(/(?:imdb\.com\/name\/)?(nm\d+)/i);
  return match ? match[1].toLowerCase() : null;
}

export default function TalentProfilePage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [directory, setDirectory] = useState<DirectoryData | null>(null);
  const [tmdb, setTmdb] = useState<TmdbPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [tmdbError, setTmdbError] = useState<string | null>(null);

  const entry = directory?.Talent?.find((e) => e.id === slug);

  const hasManualCredits =
    entry?.credits &&
    ((entry.credits.film?.length ?? 0) > 0 ||
      (entry.credits.theatre?.length ?? 0) > 0 ||
      (entry.credits.training?.length ?? 0) > 0 ||
      (entry.credits.television?.length ?? 0) > 0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setTmdbError(null);
    fetch("/data/directory.json")
      .then((r) => r.json())
      .then((data: DirectoryData) => {
        if (cancelled) return;
        setDirectory(data);
        const person = data.Talent?.find((e) => e.id === slug);
        const imdbId = person?.link ? parseImdbId(person.link) : null;
        if (!imdbId) {
          setLoading(false);
          return;
        }
        return fetch(`/api/tmdb/person?imdbId=${encodeURIComponent(imdbId)}`)
          .then((res) => res.json())
          .then((json: TmdbPerson | { error: string }) => {
            if (cancelled) return;
            if ("error" in json) {
              setTmdb(null);
              setTmdbError((json as { error: string }).error);
            } else {
              setTmdb(json as TmdbPerson);
            }
          })
          .catch((err) => {
            if (!cancelled) setTmdbError(err instanceof Error ? err.message : "Failed to load");
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      })
      .catch(() => {
        if (!cancelled) {
          setTmdbError("Failed to load directory");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading && !entry) {
    return (
      <div className="resources-page">
        <div className="resources-content">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="resources-page">
        <div className="resources-content">
          <p>Cast member not found.</p>
          <p>
            <Link href="/directory/cast">← Back to Cast directory</Link>
          </p>
        </div>
      </div>
    );
  }

  const hasManualPhoto = entry.photoUrl?.trim();
  const tmdbPhotoUrl = tmdb?.imageUrl ?? null;

  const movieCast = (tmdb?.movieCredits?.cast ?? []).slice(0, 30);
  const tvCast = (tmdb?.tvCredits?.cast ?? []).slice(0, 30);
  const hasTmdbCredits = movieCast.length > 0 || tvCast.length > 0;

  return (
    <div className="resources-page talent-profile-page">
      <div className="resources-content talent-profile-content">
        <p style={{ marginBottom: "1rem" }}>
          <Link href="/directory/cast" className="resource-link">
            ← Back to Cast directory
          </Link>
        </p>

        <header className="talent-profile-header">
          <div className="talent-profile-photo">
            {hasManualPhoto ? (
              <img
                src={entry.photoUrl!}
                alt=""
                style={{ width: "100%", height: "auto", borderRadius: "var(--radius, 8px)" }}
              />
            ) : tmdbPhotoUrl ? (
              <Image
                src={tmdbPhotoUrl}
                alt=""
                width={342}
                height={513}
                sizes="(max-width: 400px) 200px, 342px"
                style={{ width: "100%", height: "auto", borderRadius: "var(--radius, 8px)" }}
              />
            ) : (
              <div className="talent-profile-placeholder" aria-hidden>
                No photo
              </div>
            )}
          </div>
          <div className="talent-profile-info">
            <h1 className="talent-profile-name">{entry.name}</h1>
            {entry.pronouns && (
              <p className="talent-profile-pronouns">{entry.pronouns}</p>
            )}
            {entry.description && (
              <p className="talent-profile-bio">{entry.description}</p>
            )}
            <div className="talent-profile-contact">
              {entry.link && (
                <a href={entry.link} target="_blank" rel="noopener noreferrer" className="talent-profile-contact-icon" title="IMDb profile" aria-label="IMDb profile">
                  <ImdbIcon />
                </a>
              )}
              {entry.email?.trim() && (
                <a href={`mailto:${entry.email}`} className="resource-link">
                  {entry.email}
                </a>
              )}
              {entry.instagram?.trim() && (
                <a href={entry.instagram} target="_blank" rel="noopener noreferrer" className="talent-profile-contact-icon" title="Instagram" aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {entry.contactLink?.trim() && !entry.instagram?.trim() && (
                <a href={entry.contactLink} target="_blank" rel="noopener noreferrer" className="resource-link">
                  {entry.contactLabel || "Contact"}
                </a>
              )}
              {entry.otherLinks?.filter((l) => l.url?.trim()).map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                  {link.label?.trim() || "Link"}
                </a>
              ))}
            </div>
          </div>
        </header>

        {hasManualCredits && (
          <section className="talent-resume">
            <h2 className="talent-resume-title">Credits</h2>
            {(entry.credits!.film?.length ?? 0) > 0 && (
              <div className="talent-resume-section">
                <h3>Film</h3>
                <CreditsTable category="film" rows={entry.credits!.film!} />
              </div>
            )}
            {(entry.credits!.theatre?.length ?? 0) > 0 && (
              <div className="talent-resume-section">
                <h3>Theatre</h3>
                <CreditsTable category="theatre" rows={entry.credits!.theatre!} />
              </div>
            )}
            {(entry.credits!.training?.length ?? 0) > 0 && (
              <div className="talent-resume-section">
                <h3>Training</h3>
                <CreditsTable category="training" rows={entry.credits!.training!} />
              </div>
            )}
            {(entry.credits!.television?.length ?? 0) > 0 && (
              <div className="talent-resume-section">
                <h3>Television</h3>
                <CreditsTable category="television" rows={entry.credits!.television!} />
              </div>
            )}
          </section>
        )}

        {!hasManualCredits && hasTmdbCredits && (
          <section className="talent-resume">
            <h2 className="talent-resume-title">Credits</h2>
            {tmdbError && (
              <p className="talent-profile-error" role="alert">
                {tmdbError}
              </p>
            )}
            <p className="talent-resume-intro">
              Film and TV credits from The Movie Database (TMDB).
            </p>
            {movieCast.length > 0 && (
              <div className="talent-resume-section">
                <h3>Film</h3>
                <ul className="talent-resume-list">
                  {movieCast.map((item, i) => (
                    <li key={i} className="talent-resume-item">
                      <span className="talent-resume-title-cell">{item.title}</span>
                      {item.character && (
                        <span className="talent-resume-role"> as {item.character}</span>
                      )}
                      {item.release_date && (
                        <span className="talent-resume-year"> ({item.release_date.slice(0, 4)})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tvCast.length > 0 && (
              <div className="talent-resume-section">
                <h3>Television</h3>
                <ul className="talent-resume-list">
                  {tvCast.map((item, i) => (
                    <li key={i} className="talent-resume-item">
                      <span className="talent-resume-title-cell">{item.name}</span>
                      {item.character && (
                        <span className="talent-resume-role"> as {item.character}</span>
                      )}
                      {item.first_air_date && (
                        <span className="talent-resume-year"> ({item.first_air_date.slice(0, 4)})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {!hasManualCredits && !hasTmdbCredits && tmdbError && (
          <p className="talent-profile-error" role="alert">
            {tmdbError}
          </p>
        )}
      </div>
    </div>
  );
}

const CREDIT_DISPLAY_COLS: Record<keyof CreditsByCategory, { key: keyof CreditRow; header: string }[]> = {
  film: [
    { key: "projectName", header: "Project" },
    { key: "characterOrRole", header: "Character / Role" },
  ],
  theatre: [
    { key: "projectName", header: "Project" },
    { key: "characterOrRole", header: "Character / Role" },
    { key: "directorOrStudio", header: "Director / Studio" },
  ],
  training: [
    { key: "projectName", header: "Course" },
    { key: "characterOrRole", header: "Instructor" },
    { key: "directorOrStudio", header: "Studio" },
  ],
  television: [
    { key: "projectName", header: "Show" },
    { key: "characterOrRole", header: "Character / Role" },
  ],
};

function CreditsTable({ category, rows }: { category: keyof CreditsByCategory; rows: CreditRow[] }) {
  const cols = CREDIT_DISPLAY_COLS[category];
  const filtered = rows.filter(
    (r) => r.projectName?.trim() || r.characterOrRole?.trim() || r.directorOrStudio?.trim()
  );
  if (filtered.length === 0) return null;
  return (
    <table className="talent-credits-table">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.key}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map((row, i) => (
          <tr key={i}>
            {cols.map((c) => (
              <td key={c.key}>{row[c.key]?.trim() || "—"}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ImdbIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M4 4h4v16H4V4zm6 0h2v16h-2V4zm6 0h4v16h-4V4z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
