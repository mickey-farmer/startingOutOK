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
      (entry.credits.training?.length ?? 0) > 0);

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
                <a href={entry.link} target="_blank" rel="noopener noreferrer" className="resource-link">
                  IMDb profile
                </a>
              )}
              {entry.email?.trim() && (
                <a href={`mailto:${entry.email}`} className="resource-link">
                  {entry.email}
                </a>
              )}
              {entry.instagram?.trim() && (
                <a href={entry.instagram} target="_blank" rel="noopener noreferrer" className="resource-link">
                  Instagram
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
                <CreditsTable rows={entry.credits!.film!} />
              </div>
            )}
            {(entry.credits!.theatre?.length ?? 0) > 0 && (
              <div className="talent-resume-section">
                <h3>Theatre</h3>
                <CreditsTable rows={entry.credits!.theatre!} />
              </div>
            )}
            {(entry.credits!.training?.length ?? 0) > 0 && (
              <div className="talent-resume-section">
                <h3>Training</h3>
                <CreditsTable rows={entry.credits!.training!} />
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

function CreditsTable({ rows }: { rows: CreditRow[] }) {
  const filtered = rows.filter(
    (r) => r.projectName?.trim() || r.characterOrRole?.trim() || r.directorOrStudio?.trim()
  );
  if (filtered.length === 0) return null;
  return (
    <table className="talent-credits-table">
      <thead>
        <tr>
          <th>Project</th>
          <th>Character / Role</th>
          <th>Director / Studio</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((row, i) => (
          <tr key={i}>
            <td>{row.projectName?.trim() || "—"}</td>
            <td>{row.characterOrRole?.trim() || "—"}</td>
            <td>{row.directorOrStudio?.trim() || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
