"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { CastEntry, DirectoryData, CreditRow, CreditsByCategory } from "@/lib/cast-types";

const TALENT = "Talent";

const CREDIT_CATEGORIES = ["film", "theatre", "training", "television"] as const;
const CREDIT_LABELS: Record<(typeof CREDIT_CATEGORIES)[number], string> = {
  film: "Film",
  theatre: "Theatre",
  training: "Training",
  television: "Television",
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function parseImdbId(link: string): string | null {
  const match = (link || "").match(/(?:imdb\.com\/name\/)?(nm\d+)/i);
  return match ? match[1].toLowerCase() : null;
}

function parseTmdbPersonId(input: string): number | null {
  const trimmed = (input || "").trim();
  const fromUrl = trimmed.match(/(?:themoviedb\.org\/person\/|person\/)(\d+)/i);
  if (fromUrl) return parseInt(fromUrl[1], 10);
  const raw = trimmed.match(/^(\d+)$/);
  return raw ? parseInt(raw[1], 10) : null;
}

export default function AdminCastPage() {
  const [data, setData] = useState<DirectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/data/directory.json");
      if (!res.ok) throw new Error("Failed to load directory");
      const json: DirectoryData = await res.json();
      setData(json);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function getCastList(): CastEntry[] {
    const list = data?.[TALENT] || [];
    return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  function setTalent(entries: CastEntry[]) {
    if (!data) return;
    const sorted = [...entries].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setData({ ...data, [TALENT]: sorted });
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          path: "public/data/directory.json",
          content: JSON.stringify(data, null, 2),
          message: "Admin: update cast directory",
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: result.error || "Save failed" });
        return;
      }
      setMessage({ type: "success", text: "Saved. Site will update after deploy." });
      setEditing(null);
      setAdding(false);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  function updateEntry(index: number, updates: Partial<CastEntry>) {
    const list = getCastList();
    const next = list.map((e, i) => (i === index ? { ...e, ...updates } : e));
    setTalent(next);
    setEditing(null);
  }

  function addEntry(entry: CastEntry) {
    const list = getCastList();
    const id = entry.id?.trim() || toSlug(entry.name);
    setTalent([...list, { ...entry, id }]);
    setAdding(false);
  }

  function removeEntry(index: number) {
    const list = getCastList().filter((_, i) => i !== index);
    setTalent(list);
    setEditing(null);
  }

  if (loading || !data) {
    return (
      <div>
        <h1 className="admin-page-title">Cast</h1>
        <p>{loading ? "Loading…" : "Failed to load directory."}</p>
      </div>
    );
  }

  const castList = getCastList();

  return (
    <>
      <h1 className="admin-page-title">Cast</h1>
      <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--color-muted)" }}>
        Talent directory. Sorted alphabetically by name.{" "}
        <Link href="/directory/cast" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>
          View Cast on site
        </Link>
      </p>
      {message && (
        <div className={`admin-alert admin-alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={saving}
          onClick={() => handleSave()}
        >
          {saving ? "Saving…" : "Save changes to repo"}
        </button>
      </div>
      {adding ? (
        <div className="admin-card">
          <CastEntryForm
            entry={null}
            onSave={(entry) => addEntry(entry)}
            onCancel={() => setAdding(false)}
            onUploadImage={async (path, base64) => {
              const res = await fetch("/api/admin/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ path, imageBase64: base64, message: "Admin: add cast photo" }),
              });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || "Upload failed");
              }
            }}
          />
        </div>
      ) : (
        <div className="admin-card">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setAdding(true)}
          >
            + Add cast member
          </button>
        </div>
      )}
      <div className="admin-card">
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem", fontWeight: 600 }}>
          Cast list (alphabetical)
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {castList.map((entry, index) => (
            <li key={entry.id} style={{ marginBottom: "0.5rem", padding: "0.5rem", background: "rgba(0,0,0,0.03)", borderRadius: 6 }}>
              {editing === index ? (
                <CastEntryForm
                  entry={entry}
                  onSave={(updates) => updateEntry(index, updates)}
                  onCancel={() => setEditing(null)}
                  onUploadImage={async (path, base64) => {
                    const res = await fetch("/api/admin/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ path, imageBase64: base64, message: "Admin: update cast photo" }),
                    });
                    if (!res.ok) {
                      const j = await res.json().catch(() => ({}));
                      throw new Error(j.error || "Upload failed");
                    }
                  }}
                />
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong>{entry.name}</strong>
                    {entry.pronouns && (
                      <span style={{ color: "var(--color-muted)", marginLeft: "0.25rem" }}>
                        ({entry.pronouns})
                      </span>
                    )}
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                      {entry.link && <a href={entry.link} target="_blank" rel="noopener noreferrer">IMDb</a>}
                      {entry.email && (entry.link ? ` · ${entry.email}` : entry.email)}
                      {entry.instagram && ` · Instagram`}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: "0.8rem" }}
                      onClick={() => setEditing(index)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: "0.8rem", color: "#b91c1c" }}
                      onClick={() => {
                        if (confirm("Remove this cast member?")) removeEntry(index);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {castList.length === 0 && (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "var(--color-muted)" }}>
            No cast members yet. Add one above.
          </p>
        )}
      </div>
    </>
  );
}

type TmdbSearchResult = {
  personId: number;
  imageUrl: string | null;
  name?: string;
  movieCredits: { cast: { title?: string; character?: string; release_date?: string }[] };
  tvCredits: { cast: { name?: string; character?: string; first_air_date?: string }[] };
};

function CastEntryForm({
  entry,
  onSave,
  onCancel,
  onUploadImage,
}: {
  entry: CastEntry | null;
  onSave: (entry: CastEntry) => void;
  onCancel: () => void;
  onUploadImage: (path: string, base64: string) => Promise<void>;
}) {
  const [name, setName] = useState(entry?.name ?? "");
  const [pronouns, setPronouns] = useState(entry?.pronouns ?? "");
  const [imdbLink, setImdbLink] = useState(entry?.link ?? "");
  const [tmdbPersonId, setTmdbPersonId] = useState<number | null>(entry?.tmdbPersonId ?? null);
  const [tmdbSearch, setTmdbSearch] = useState<TmdbSearchResult | null>(null);
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(entry?.photoUrl ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [email, setEmail] = useState(entry?.email ?? "");
  const [instagram, setInstagram] = useState(entry?.instagram ?? "");
  const [otherLinks, setOtherLinks] = useState(entry?.otherLinks ?? []);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [id, setId] = useState(entry?.id ?? "");
  const [credits, setCredits] = useState<CreditsByCategory>({
    film: entry?.credits?.film ?? [],
    theatre: entry?.credits?.theatre ?? [],
    training: entry?.credits?.training ?? [],
    television: entry?.credits?.television ?? [],
  });

  function addCreditRow(category: keyof CreditsByCategory) {
    const list = credits[category] ?? [];
    setCredits({ ...credits, [category]: [...list, { projectName: "", characterOrRole: "", directorOrStudio: "" }] });
  }
  function updateCreditRow(category: keyof CreditsByCategory, index: number, field: keyof CreditRow, value: string) {
    const list = [...(credits[category] ?? [])];
    list[index] = { ...list[index], [field]: value };
    setCredits({ ...credits, [category]: list });
  }
  function removeCreditRow(category: keyof CreditsByCategory, index: number) {
    const list = (credits[category] ?? []).filter((_, i) => i !== index);
    setCredits({ ...credits, [category]: list });
  }

  async function handleSearchTmdb() {
    const imdbId = parseImdbId(imdbLink);
    const tmdbId = parseTmdbPersonId(imdbLink);
    if (!imdbId && tmdbId == null) {
      return;
    }
    setTmdbSearching(true);
    setTmdbSearch(null);
    try {
      const q = imdbId
        ? `imdbId=${encodeURIComponent(imdbId)}`
        : `personId=${encodeURIComponent(tmdbId!)}`;
      const res = await fetch(`/api/tmdb/person?${q}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "TMDB search failed");
      setTmdbSearch({
        personId: json.personId,
        imageUrl: json.imageUrl ?? null,
        name: (json.details as { name?: string })?.name,
        movieCredits: json.movieCredits ?? { cast: [] },
        tvCredits: json.tvCredits ?? { cast: [] },
      });
    } catch (e) {
      setTmdbSearch(null);
    } finally {
      setTmdbSearching(false);
    }
  }

  function handleImportCreditsFromTmdb() {
    if (!tmdbSearch) return;
    const filmRows: CreditRow[] = (tmdbSearch.movieCredits?.cast ?? []).map((c) => ({
      projectName: c.title ?? "",
      characterOrRole: c.character ?? "",
      directorOrStudio: c.release_date ? c.release_date.slice(0, 4) : "",
    }));
    const tvRows: CreditRow[] = (tmdbSearch.tvCredits?.cast ?? []).map((c) => ({
      projectName: c.name ?? "",
      characterOrRole: c.character ?? "",
      directorOrStudio: c.first_air_date ? c.first_air_date.slice(0, 4) : "",
    }));
    setCredits((prev) => ({
      ...prev,
      film: [...(prev.film ?? []), ...filmRows],
      television: [...(prev.television ?? []), ...tvRows],
    }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const slug = id.trim() || toSlug(name);
    if (!slug) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `public/images/cast/${slug}.${ext}`;
    setPhotoUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await onUploadImage(path, base64);
      setPhotoUrl(`/images/cast/${slug}.${ext}`);
    } catch (err) {
      // could set error state
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  }

  function handleSubmit() {
    const slug = id.trim() || toSlug(name);
    if (!name.trim()) return;
    const contactLink = instagram.trim() || (otherLinks[0]?.url);
    const contactLabel = instagram.trim() ? "Instagram" : (otherLinks[0]?.label || "Link");
    const hasCredits =
      (credits.film?.length ?? 0) > 0 ||
      (credits.theatre?.length ?? 0) > 0 ||
      (credits.training?.length ?? 0) > 0 ||
      (credits.television?.length ?? 0) > 0;
    onSave({
      id: slug,
      name: name.trim(),
      pronouns: pronouns.trim() || null,
      description: description.trim() || null,
      location: null,
      link: imdbLink.trim() || null,
      contactLink: contactLink || null,
      contactLabel: contactLabel || null,
      email: email.trim() || null,
      instagram: instagram.trim() || null,
      otherLinks: otherLinks.length ? otherLinks : null,
      pills: undefined,
      tmdbPersonId: tmdbPersonId ?? null,
      photoUrl: photoUrl.trim() || null,
      credits: hasCredits ? credits : null,
    });
  }

  function addOtherLink() {
    setOtherLinks([...otherLinks, { label: "", url: "" }]);
  }
  function updateOtherLink(i: number, field: "label" | "url", value: string) {
    const next = [...otherLinks];
    next[i] = { ...next[i], [field]: value };
    setOtherLinks(next);
  }
  function removeOtherLink(i: number) {
    setOtherLinks(otherLinks.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div className="admin-form-group">
        <label>Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
      </div>
      <div className="admin-form-group">
        <label>Pronouns (optional)</label>
        <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="she/her" />
      </div>

      <div className="admin-form-group">
        <label>IMDb or TMDB link (optional)</label>
        <input
          type="text"
          value={imdbLink}
          onChange={(e) => { setImdbLink(e.target.value); setTmdbSearch(null); }}
          placeholder="IMDb: imdb.com/name/nm1234567  or  TMDB: themoviedb.org/person/12345"
        />
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Paste an IMDb name link or a TMDB person link. TMDB works for many local actors when IMDb lookup fails.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={!imdbLink.trim() || tmdbSearching}
            onClick={handleSearchTmdb}
          >
            {tmdbSearching ? "Searching…" : "Search TMDB"}
          </button>
          {tmdbSearch && (
            <>
              <span style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {tmdbSearch.imageUrl && (
                  <img src={tmdbSearch.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />
                )}
                <span>{tmdbSearch.name ?? "TMDB profile found"}</span>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => { setTmdbPersonId(tmdbSearch.personId); }}
                >
                  Use this TMDB profile
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: "0.8rem" }}
                  onClick={handleImportCreditsFromTmdb}
                >
                  Import credits from TMDB
                </button>
              </span>
            </>
          )}
          {tmdbPersonId != null && !tmdbSearch && (
            <span style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
              TMDB linked
            </span>
          )}
        </div>
      </div>

      <div className="admin-form-group">
        <label>Photo (optional)</label>
        <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Photo URL or upload an image. Uploaded images are stored in the repo.
        </p>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://… or /images/cast/name.jpg"
          style={{ marginBottom: "0.25rem" }}
        />
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={photoUploading}
          />
          {photoUploading && <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>Uploading…</span>}
        </div>
      </div>

      <div className="admin-form-group">
        <label>Credits (optional)</label>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Project name, character/role, and director or studio. Add by category.
        </p>
        {CREDIT_CATEGORIES.map((category) => {
          const rows = credits[category] ?? [];
          return (
            <div key={category} style={{ marginBottom: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 600 }}>
                {CREDIT_LABELS[category]}
              </h4>
              <table className="admin-credits-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Character / Role</th>
                    <th>Director / Studio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          value={row.projectName}
                          onChange={(e) => updateCreditRow(category, i, "projectName", e.target.value)}
                          placeholder="Project name"
                        />
                      </td>
                      <td>
                        <input
                          value={row.characterOrRole}
                          onChange={(e) => updateCreditRow(category, i, "characterOrRole", e.target.value)}
                          placeholder="Character or role type"
                        />
                      </td>
                      <td>
                        <input
                          value={row.directorOrStudio}
                          onChange={(e) => updateCreditRow(category, i, "directorOrStudio", e.target.value)}
                          placeholder="Director or studio"
                        />
                      </td>
                      <td>
                        <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => removeCreditRow(category, i)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }} onClick={() => addCreditRow(category)}>
                + Add {CREDIT_LABELS[category]} credit
              </button>
            </div>
          );
        })}
      </div>

      <div className="admin-form-group">
        <label>Contact (optional — only displayed when set)</label>
      </div>
      <div className="admin-form-group">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
      </div>
      <div className="admin-form-group">
        <label>Instagram</label>
        <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://www.instagram.com/username/" />
      </div>
      <div className="admin-form-group">
        <label>Other links</label>
        {otherLinks.map((link, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem", alignItems: "center" }}>
            <input placeholder="Label" value={link.label} onChange={(e) => updateOtherLink(i, "label", e.target.value)} style={{ width: "100px" }} />
            <input type="url" placeholder="URL" value={link.url} onChange={(e) => updateOtherLink(i, "url", e.target.value)} style={{ flex: 1 }} />
            <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => removeOtherLink(i)}>Remove</button>
          </div>
        ))}
        <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }} onClick={addOtherLink}>+ Add link</button>
      </div>

      <div className="admin-form-group">
        <label>Short bio (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} />
      </div>
      <div className="admin-form-group">
        <label>URL slug (optional)</label>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder={toSlug(name) || "jane-doe"} />
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Profile URL: /directory/cast/[slug]
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" className="admin-btn admin-btn-primary" onClick={handleSubmit}>
          {entry ? "Save" : "Add cast member"}
        </button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
