"use client";

import { useState, useEffect, useCallback } from "react";

type CastingListEntry = {
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

type CastingRole = {
  roleTitle?: string;
  description?: string;
  pay?: string;
  ageRange?: string;
  type?: string;
  union?: string;
  gender?: string;
  ethnicity?: string;
};

type CastingDetail = {
  slug: string;
  id?: string;
  title: string;
  date?: string | null;
  auditionDeadline?: string | null;
  location?: string | null;
  director?: string | null;
  filmingDates?: string | null;
  description?: string | null;
  submissionDetails?: string | null;
  sourceLink?: string | null;
  exclusive?: boolean;
  under18?: boolean;
  roles?: CastingRole[];
};

function listEntryFromDetail(d: CastingDetail): CastingListEntry {
  return {
    slug: d.slug,
    title: d.title,
    date: d.date ?? null,
    auditionDeadline: d.auditionDeadline ?? null,
    location: d.location ?? null,
    pay: null,
    type: (d.roles?.[0] as { type?: string } | undefined)?.type ?? null,
    union: (d.roles?.[0] as { union?: string } | undefined)?.union ?? null,
    under18: d.under18 ?? false,
    roleCount: d.roles?.length ?? 0,
    archived: false,
  };
}

export default function AdminCastingCallsPage() {
  const [list, setList] = useState<CastingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, dsRes] = await Promise.all([
        fetch("/api/data/casting-calls"),
        fetch("/api/admin/data-source", { credentials: "include" }),
      ]);
      if (!listRes.ok) throw new Error("Failed to load casting calls");
      const data: CastingListEntry[] = await listRes.json();
      setList(Array.isArray(data) ? data : []);
      const ds = await dsRes.json().catch(() => ({}));
      setUseSupabase(!!ds.useSupabase);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  async function saveFile(path: string, content: string, commitMessage: string): Promise<boolean> {
    const res = await fetch("/api/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ path, content, message: commitMessage }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage({ type: "error", text: result.error || "Save failed" });
      return false;
    }
    return true;
  }

  async function handleSaveList(newList: CastingListEntry[]) {
    setSaving(true);
    setMessage(null);
    const ok = await saveFile(
      "public/data/casting-calls.json",
      JSON.stringify(newList, null, 2),
      "Admin: update casting calls list"
    );
    if (ok) {
      setMessage({ type: "success", text: "List saved. Site will update after deploy." });
      setList(newList);
    }
    setSaving(false);
  }

  function payloadFromDetail(detail: CastingDetail, listEntry: CastingListEntry) {
    return {
      slug: detail.slug,
      title: detail.title,
      date: detail.date ?? null,
      auditionDeadline: detail.auditionDeadline ?? null,
      location: detail.location ?? null,
      pay: listEntry.pay ?? (detail.roles?.[0] as { pay?: string } | undefined)?.pay ?? null,
      type: detail.roles?.[0]?.type ?? listEntry.type ?? null,
      union: detail.roles?.[0]?.union ?? listEntry.union ?? null,
      under18: detail.under18 ?? false,
      roleCount: detail.roles?.length ?? 0,
      archived: listEntry.archived ?? false,
      description: detail.description ?? null,
      director: detail.director ?? null,
      filmingDates: detail.filmingDates ?? null,
      submissionDetails: detail.submissionDetails ?? null,
      sourceLink: detail.sourceLink ?? null,
      exclusive: detail.exclusive ?? false,
      roles: detail.roles ?? [],
    };
  }

  async function handleSaveDetail(detail: CastingDetail, listEntry: CastingListEntry) {
    setSaving(true);
    setMessage(null);
    if (useSupabase) {
      const res = await fetch("/api/admin/supabase/casting-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payloadFromDetail(detail, listEntry)),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: result.error || "Save failed" });
        setSaving(false);
        return;
      }
      setMessage({ type: "success", text: "Saved to database." });
      setList((prev) => prev.map((e) => (e.slug === listEntry.slug ? listEntry : e)));
      setEditingSlug(null);
      setSaving(false);
      return;
    }
    const detailPath = `public/data/casting-calls/${encodeURIComponent(detail.slug)}.json`;
    const detailPayload = { ...detail, id: detail.slug, slug: detail.slug };
    const ok1 = await saveFile(
      detailPath,
      JSON.stringify(detailPayload, null, 2),
      "Admin: update casting call " + detail.slug
    );
    if (!ok1) {
      setSaving(false);
      return;
    }
    const updatedList = list.map((e) => (e.slug === listEntry.slug ? listEntry : e));
    const ok2 = await saveFile(
      "public/data/casting-calls.json",
      JSON.stringify(updatedList, null, 2),
      "Admin: update casting calls list"
    );
    if (ok2) {
      setMessage({ type: "success", text: "Saved. Site will update after deploy." });
      setList(updatedList);
      setEditingSlug(null);
    }
    setSaving(false);
  }

  async function handleAdd(detail: CastingDetail) {
    setSaving(true);
    setMessage(null);
    const listEntry = listEntryFromDetail(detail);
    if (useSupabase) {
      const res = await fetch("/api/admin/supabase/casting-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payloadFromDetail(detail, listEntry)),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: result.error || "Save failed" });
        setSaving(false);
        return;
      }
      setMessage({ type: "success", text: "Casting call added." });
      setList((prev) => [...prev, listEntry]);
      setAdding(false);
      setSaving(false);
      return;
    }
    const detailPath = `public/data/casting-calls/${encodeURIComponent(detail.slug)}.json`;
    const detailPayload = { ...detail, id: detail.slug, slug: detail.slug };
    const ok1 = await saveFile(
      detailPath,
      JSON.stringify(detailPayload, null, 2),
      "Admin: add casting call " + detail.slug
    );
    if (!ok1) {
      setSaving(false);
      return;
    }
    const newList = [...list, listEntry];
    const ok2 = await saveFile(
      "public/data/casting-calls.json",
      JSON.stringify(newList, null, 2),
      "Admin: update casting calls list"
    );
    if (ok2) {
      setMessage({ type: "success", text: "Casting call added. Site will update after deploy." });
      setList(newList);
      setAdding(false);
    }
    setSaving(false);
  }

  async function removeFromList(slug: string) {
    if (useSupabase) {
      setSaving(true);
      setMessage(null);
      const res = await fetch(`/api/admin/supabase/casting-calls/delete?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: result.error || "Delete failed" });
      } else {
        setList((prev) => prev.filter((e) => e.slug !== slug));
        setMessage({ type: "success", text: "Removed from database." });
      }
      setEditingSlug(null);
      setSaving(false);
      return;
    }
    const newList = list.filter((e) => e.slug !== slug);
    await handleSaveList(newList);
    setEditingSlug(null);
  }

  async function setArchived(slug: string, archived: boolean) {
    if (useSupabase) {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/admin/supabase/casting-calls/patch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug, archived }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: result.error || "Update failed" });
      } else {
        setList((prev) => prev.map((e) => (e.slug === slug ? { ...e, archived } : e)));
        setMessage({ type: "success", text: archived ? "Archived." : "Unarchived." });
      }
      setSaving(false);
      return;
    }
    const newList = list.map((e) => (e.slug === slug ? { ...e, archived } : e));
    await handleSaveList(newList);
  }

  if (loading) {
    return (
      <div>
        <h1 className="admin-page-title">Casting Calls</h1>
        <p>Loading…</p>
      </div>
    );
  }

  const activeList = list.filter((e) => !e.archived);
  const archivedList = list.filter((e) => e.archived);

  return (
    <>
      <h1 className="admin-page-title">Casting Calls</h1>
      <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--color-muted)" }}>
        List and detail are stored in the repo. Edit a call to change its detail page; archive to hide from the main list.
      </p>
      {message && (
        <div className={`admin-alert admin-alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        {!adding && (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={saving}
            onClick={() => setAdding(true)}
          >
            + Add casting call
          </button>
        )}
      </div>

      {adding && (
        <div className="admin-card">
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>New casting call</h2>
          <CastingCallForm
            initialDetail={{
              slug: "",
              title: "",
              date: null,
              auditionDeadline: null,
              location: null,
              director: null,
              filmingDates: null,
              description: null,
              submissionDetails: null,
              sourceLink: null,
              exclusive: false,
              under18: false,
              roles: [],
            }}
            onSave={(d) => {
              const entry = listEntryFromDetail(d);
              handleAdd(d);
            }}
            onCancel={() => setAdding(false)}
            saving={saving}
          />
        </div>
      )}

      {list.map((entry) => (
        <div key={entry.slug} className="admin-card">
          {editingSlug === entry.slug ? (
            <CastingCallEditor
              slug={entry.slug}
              listEntry={entry}
              onSave={(detail, listEntry) => handleSaveDetail(detail, listEntry)}
              onCancel={() => setEditingSlug(null)}
              onRemove={() => removeFromList(entry.slug)}
              saving={saving}
            />
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <strong>{entry.title}</strong>
                <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem", fontSize: "0.9rem" }}>({entry.slug})</span>
                {entry.archived && <span style={{ marginLeft: "0.5rem", color: "#b91c1c" }}>Archived</span>}
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "var(--color-muted)" }}>
                  {entry.auditionDeadline && `Deadline: ${entry.auditionDeadline}`}
                  {entry.location && ` · ${entry.location}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => setEditingSlug(entry.slug)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => setArchived(entry.slug, !entry.archived)}
                >
                  {entry.archived ? "Unarchive" : "Archive"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: "0.8rem", color: "#b91c1c" }}
                  onClick={() => confirm("Remove from list? (Detail file will remain.)") && removeFromList(entry.slug)}
                >
                  Remove from list
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function CastingCallEditor({
  slug,
  listEntry,
  onSave,
  onCancel,
  onRemove,
  saving,
}: {
  slug: string;
  listEntry: CastingListEntry;
  onSave: (detail: CastingDetail, listEntry: CastingListEntry) => void;
  onCancel: () => void;
  onRemove: () => void;
  saving: boolean;
}) {
  const [detail, setDetail] = useState<CastingDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    fetch(`/api/data/casting-calls/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setDetail(d);
        else setDetail(buildDetailFromList(listEntry));
      })
      .catch(() => setDetail(buildDetailFromList(listEntry)))
      .finally(() => setLoadingDetail(false));
  }, [slug]);

  if (loadingDetail || !detail) {
    return <p>Loading detail…</p>;
  }

  return (
    <>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>Edit: {listEntry.title}</h2>
      <CastingCallForm
        initialDetail={detail}
        onSave={(d) => {
          const entry: CastingListEntry = {
            slug: d.slug,
            title: d.title,
            date: d.date ?? null,
            auditionDeadline: d.auditionDeadline ?? null,
            location: d.location ?? null,
            pay: d.roles?.[0]?.pay ?? null,
            type: d.roles?.[0]?.type ?? null,
            union: d.roles?.[0]?.union ?? null,
            under18: d.under18 ?? false,
            roleCount: d.roles?.length ?? 0,
            archived: listEntry.archived,
          };
          onSave(d, entry);
        }}
        onCancel={onCancel}
        saving={saving}
        onRemove={onRemove}
      />
    </>
  );
}

function buildDetailFromList(e: CastingListEntry): CastingDetail {
  return {
    slug: e.slug,
    title: e.title,
    date: e.date,
    auditionDeadline: e.auditionDeadline,
    location: e.location,
    director: null,
    filmingDates: null,
    description: null,
    submissionDetails: null,
    sourceLink: null,
    exclusive: false,
    under18: e.under18,
    roles: [],
  };
}

function CastingCallForm({
  initialDetail,
  onSave,
  onCancel,
  saving,
  onRemove,
}: {
  initialDetail: CastingDetail;
  onSave: (d: CastingDetail) => void;
  onCancel: () => void;
  saving: boolean;
  onRemove?: () => void;
}) {
  const [slug, setSlug] = useState(initialDetail.slug);
  const [title, setTitle] = useState(initialDetail.title);
  const [date, setDate] = useState(initialDetail.date ?? "");
  const [auditionDeadline, setAuditionDeadline] = useState(initialDetail.auditionDeadline ?? "");
  const [location, setLocation] = useState(initialDetail.location ?? "");
  const [director, setDirector] = useState(initialDetail.director ?? "");
  const [filmingDates, setFilmingDates] = useState(initialDetail.filmingDates ?? "");
  const [description, setDescription] = useState(initialDetail.description ?? "");
  const [submissionDetails, setSubmissionDetails] = useState(initialDetail.submissionDetails ?? "");
  const [sourceLink, setSourceLink] = useState(initialDetail.sourceLink ?? "");
  const [exclusive, setExclusive] = useState(initialDetail.exclusive ?? false);
  const [under18, setUnder18] = useState(initialDetail.under18 ?? false);
  const [roles, setRoles] = useState<CastingRole[]>(initialDetail.roles?.length ? initialDetail.roles : []);

  function handleSubmit() {
    const d: CastingDetail = {
      slug: slug.trim() || "casting-" + Date.now(),
      title: title.trim(),
      date: date.trim() || null,
      auditionDeadline: auditionDeadline.trim() || null,
      location: location.trim() || null,
      director: director.trim() || null,
      filmingDates: filmingDates.trim() || null,
      description: description.trim() || null,
      submissionDetails: submissionDetails.trim() || null,
      sourceLink: sourceLink.trim() || null,
      exclusive,
      under18,
      roles: roles.map((r) => ({ ...r })),
    };
    onSave(d);
  }

  function addRole() {
    setRoles((r) => [...r, { roleTitle: "", description: "", pay: "", ageRange: "", type: "Short Film", union: "Non-Union", gender: "", ethnicity: "All ethnicities" }]);
  }

  function updateRole(i: number, updates: Partial<CastingRole>) {
    setRoles((r) => r.map((item, j) => (j === i ? { ...item, ...updates } : item)));
  }

  function removeRole(i: number) {
    setRoles((r) => r.filter((_, j) => j !== i));
  }

  return (
    <div className="admin-card" style={{ marginTop: "0.5rem" }}>
      <div className="admin-form-group">
        <label>Slug (URL id)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-project-2026" />
      </div>
      <div className="admin-form-group">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="admin-form-group">
        <label>Date (posted)</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="admin-form-group">
        <label>Audition deadline</label>
        <input type="date" value={auditionDeadline} onChange={(e) => setAuditionDeadline(e.target.value)} />
      </div>
      <div className="admin-form-group">
        <label>Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="admin-form-group">
        <label>Director (optional)</label>
        <input value={director} onChange={(e) => setDirector(e.target.value)} />
      </div>
      <div className="admin-form-group">
        <label>Filming dates (optional)</label>
        <input value={filmingDates} onChange={(e) => setFilmingDates(e.target.value)} placeholder="March 14, 15, 16" />
      </div>
      <div className="admin-form-group">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>
      <div className="admin-form-group">
        <label>Submission details</label>
        <textarea value={submissionDetails} onChange={(e) => setSubmissionDetails(e.target.value)} rows={2} />
      </div>
      <div className="admin-form-group">
        <label>Source link (optional)</label>
        <input type="url" value={sourceLink} onChange={(e) => setSourceLink(e.target.value)} />
      </div>
      <div className="admin-form-group">
        <label><input type="checkbox" checked={exclusive} onChange={(e) => setExclusive(e.target.checked)} /> Exclusive</label>
      </div>
      <div className="admin-form-group">
        <label><input type="checkbox" checked={under18} onChange={(e) => setUnder18(e.target.checked)} /> Under 18</label>
      </div>

      <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "1rem" }}>Roles</h3>
      {roles.map((role, i) => (
        <div key={i} style={{ padding: "0.5rem", background: "rgba(0,0,0,0.04)", borderRadius: 6, marginBottom: "0.5rem" }}>
          <div className="admin-form-group">
            <label>Role title</label>
            <input value={role.roleTitle ?? ""} onChange={(e) => updateRole(i, { roleTitle: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label>Description</label>
            <input value={role.description ?? ""} onChange={(e) => updateRole(i, { description: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <div className="admin-form-group" style={{ flex: "1 1 120px" }><label>Pay</label><input value={role.pay ?? ""} onChange={(e) => updateRole(i, { pay: e.target.value })} /></div>
            <div className="admin-form-group" style={{ flex: "1 1 120px" }><label>Age range</label><input value={role.ageRange ?? ""} onChange={(e) => updateRole(i, { ageRange: e.target.value })} /></div>
            <div className="admin-form-group" style={{ flex: "1 1 100px" }><label>Type</label><input value={role.type ?? ""} onChange={(e) => updateRole(i, { type: e.target.value })} /></div>
            <div className="admin-form-group" style={{ flex: "1 1 100px" }><label>Union</label><input value={role.union ?? ""} onChange={(e) => updateRole(i, { union: e.target.value })} /></div>
            <div className="admin-form-group" style={{ flex: "1 1 80px" }><label>Gender</label><input value={role.gender ?? ""} onChange={(e) => updateRole(i, { gender: e.target.value })} /></div>
            <div className="admin-form-group" style={{ flex: "1 1 120px" }><label>Ethnicity</label><input value={role.ethnicity ?? ""} onChange={(e) => updateRole(i, { ethnicity: e.target.value })} /></div>
          </div>
          <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }} onClick={() => removeRole(i)}>Remove role</button>
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn-secondary" style={{ marginBottom: "1rem" }} onClick={addRole}>+ Add role</button>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" className="admin-btn admin-btn-primary" disabled={saving} onClick={handleSubmit}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>Cancel</button>
        {onRemove && (
          <button type="button" className="admin-btn admin-btn-secondary" style={{ color: "#b91c1c" }} onClick={() => confirm("Remove from list?") && onRemove()}>
            Remove from list
          </button>
        )}
      </div>
    </div>
  );
}
