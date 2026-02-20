"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type CastEntry = {
  id: string;
  name: string;
  pronouns?: string | null;
  description?: string | null;
  link?: string | null;
  contactLink?: string | null;
  contactLabel?: string | null;
  email?: string | null;
  instagram?: string | null;
  otherLinks?: { label: string; url: string }[] | null;
};

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
  const [error, setError] = useState<string | null>(null);

  const entry = directory?.Talent?.find((e) => e.id === slug);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
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
              setError((json as { error: string }).error);
            } else {
              setTmdb(json as TmdbPerson);
            }
          })
          .catch((err) => {
            if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load credits");
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load directory");
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

  const movieCast = (tmdb?.movieCredits?.cast ?? []).slice(0, 30);
  const tvCast = (tmdb?.tvCredits?.cast ?? []).slice(0, 30);

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
            {tmdb?.imageUrl ? (
              <Image
                src={tmdb.imageUrl}
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
              {entry.email && (
                <a href={`mailto:${entry.email}`} className="resource-link">
                  {entry.email}
                </a>
              )}
              {entry.instagram && (
                <a href={entry.instagram} target="_blank" rel="noopener noreferrer" className="resource-link">
                  Instagram
                </a>
              )}
              {entry.contactLink && !entry.instagram && (
                <a href={entry.contactLink} target="_blank" rel="noopener noreferrer" className="resource-link">
                  {entry.contactLabel || "Contact"}
                </a>
              )}
              {entry.otherLinks?.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </header>

        {error && (
          <p className="talent-profile-error" role="alert">
            Credits could not be loaded: {error}
          </p>
        )}

        {(movieCast.length > 0 || tvCast.length > 0) && (
          <section className="talent-resume">
            <h2 className="talent-resume-title">Credits</h2>
            <p className="talent-resume-intro">
              Film and TV credits from The Movie Database (TMDB), linked from IMDb.
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
      </div>
    </div>
  );
}
