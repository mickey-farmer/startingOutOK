"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type OtherLink = { label: string; url: string };

type CastEntry = {
  id: string;
  name: string;
  pronouns?: string | null;
  description?: string | null;
  location?: string | null;
  link?: string | null;
  contactLink?: string | null;
  contactLabel?: string | null;
  email?: string | null;
  instagram?: string | null;
  otherLinks?: OtherLink[] | null;
  pills?: string[];
};

type DirectoryData = Record<string, CastEntry[]>;

const TALENT = "Talent";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
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
    if (!entry.link?.trim()) {
      setMessage({ type: "error", text: "IMDb link is required for cast." });
      return;
    }
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
                    {entry.link && (
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                        <a href={entry.link} target="_blank" rel="noopener noreferrer">IMDb</a>
                        {entry.email && ` · ${entry.email}`}
                        {entry.instagram && ` · Instagram`}
                      </p>
                    )}
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

function CastEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: CastEntry | null;
  onSave: (entry: CastEntry) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(entry?.name ?? "");
  const [pronouns, setPronouns] = useState(entry?.pronouns ?? "");
  const [imdbLink, setImdbLink] = useState(entry?.link ?? "");
  const [email, setEmail] = useState(entry?.email ?? "");
  const [instagram, setInstagram] = useState(entry?.instagram ?? "");
  const [otherLinks, setOtherLinks] = useState<OtherLink[]>(entry?.otherLinks ?? []);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [id, setId] = useState(entry?.id ?? "");

  function handleSubmit() {
    const slug = id.trim() || toSlug(name);
    if (!name.trim()) return;
    if (!imdbLink.trim()) {
      return;
    }
    const contactLink = instagram.trim() || (otherLinks[0]?.url);
    const contactLabel = instagram.trim() ? "Instagram" : (otherLinks[0]?.label || "Link");
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
        <label>IMDb link *</label>
        <input
          type="url"
          value={imdbLink}
          onChange={(e) => setImdbLink(e.target.value)}
          placeholder="https://www.imdb.com/name/nm1234567/"
        />
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Used to pull photo and credits from TMDB on the talent profile page.
        </p>
      </div>
      <div className="admin-form-group">
        <label>Email (optional)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
        />
      </div>
      <div className="admin-form-group">
        <label>Instagram (optional)</label>
        <input
          type="url"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="https://www.instagram.com/username/"
        />
      </div>
      <div className="admin-form-group">
        <label>Other links (optional)</label>
        {otherLinks.map((link, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem", alignItems: "center" }}>
            <input
              placeholder="Label"
              value={link.label}
              onChange={(e) => updateOtherLink(i, "label", e.target.value)}
              style={{ width: "100px" }}
            />
            <input
              type="url"
              placeholder="URL"
              value={link.url}
              onChange={(e) => updateOtherLink(i, "url", e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => removeOtherLink(i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }} onClick={addOtherLink}>
          + Add link
        </button>
      </div>
      <div className="admin-form-group">
        <label>Short bio (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} />
      </div>
      <div className="admin-form-group">
        <label>URL slug (optional)</label>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder={toSlug(name) || "jane-doe"} />
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Used in profile URL: /directory/cast/[slug]
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
