"use client";

import { useState, useEffect, useCallback } from "react";

type ResourceEntry = {
  id: string;
  title: string;
  subcategory?: string | null;
  type?: string | null;
  description?: string | null;
  location?: string | null;
  link?: string | null;
  imdbLink?: string | null;
  vendor?: boolean;
  pills?: string[];
  schedule?: string | null;
};

type ResourcesData = Record<string, ResourceEntry[]>;

const RESOURCE_SECTION_ORDER = [
  "Agencies",
  "Casting",
  "Classes & Workshops",
  "Networking",
  "Photographers",
  "Props",
  "Stunts",
  "Studios & Sound Stages",
  "Theaters",
  "Vendors",
  "Voice",
  "Writing",
];

function sectionSort(a: string, b: string): number {
  const i = RESOURCE_SECTION_ORDER.indexOf(a);
  const j = RESOURCE_SECTION_ORDER.indexOf(b);
  if (i !== -1 && j !== -1) return i - j;
  if (i !== -1) return -1;
  if (j !== -1) return 1;
  return a.localeCompare(b);
}

export default function AdminResourcesPage() {
  const [data, setData] = useState<ResourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [editing, setEditing] = useState<{ section: string; index: number } | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [useSupabase, setUseSupabase] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, dsRes] = await Promise.all([
        fetch("/api/data/resources"),
        fetch("/api/admin/data-source", { credentials: "include" }),
      ]);
      if (!resRes.ok) throw new Error("Failed to load resources");
      const json: ResourcesData = await resRes.json();
      setData(json);
      const ds = await dsRes.json().catch(() => ({}));
      setUseSupabase(!!ds.useSupabase);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(newData: ResourcesData) {
    setSaving(true);
    setMessage(null);
    try {
      const url = useSupabase ? "/api/admin/supabase/resources" : "/api/admin/save";
      const body = useSupabase
        ? { resources: newData }
        : {
            path: "public/data/resources.json",
            content: JSON.stringify(newData),
            message: "Admin: update resources",
          };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: result.error || "Save failed" });
        return;
      }
      setMessage({ type: "success", text: useSupabase ? "Saved to database." : "Saved. Site will update after deploy." });
      setData(newData);
      setEditing(null);
      setAddingSection(false);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  function updateEntry(section: string, index: number, updates: Partial<ResourceEntry>) {
    if (!data) return;
    const sectionEntries = [...(data[section] || [])];
    sectionEntries[index] = { ...sectionEntries[index], ...updates };
    setData({ ...data, [section]: sectionEntries });
  }

  function addEntry(section: string, entry: ResourceEntry) {
    if (!data) return;
    const sectionEntries = [...(data[section] || []), entry];
    setData({ ...data, [section]: sectionEntries });
    setEditing(null);
  }

  function removeEntry(section: string, index: number) {
    if (!data) return;
    const sectionEntries = (data[section] || []).filter((_, i) => i !== index);
    const next = { ...data, [section]: sectionEntries };
    if (sectionEntries.length === 0) delete next[section];
    setData(next);
    setEditing(null);
  }

  function addSection(name: string) {
    const trimmed = name.trim();
    if (!trimmed || !data) return;
    if (data[trimmed]) {
      setMessage({ type: "error", text: "Section already exists" });
      return;
    }
    setData({ ...data, [trimmed]: [] });
    setNewSectionName("");
    setAddingSection(false);
  }

  function removeSection(section: string) {
    if (!data) return;
    const next = { ...data };
    delete next[section];
    setData(next);
  }

  if (loading || !data) {
    return (
      <div>
        <h1 className="admin-page-title">Resources</h1>
        <p>{loading ? "Loading…" : "Failed to load resources."}</p>
      </div>
    );
  }

  const sections = Object.keys(data).sort(sectionSort);

  return (
    <>
      <h1 className="admin-page-title">Resources</h1>
      <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--color-muted)" }}>
        Agencies, classes, theaters, vendors, etc. Edit sections and entries.
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
          onClick={() => handleSave(data)}
        >
          {saving ? "Saving…" : "Save changes to repo"}
        </button>
      </div>
      {addingSection ? (
        <div className="admin-card">
          <div className="admin-form-group">
            <label>New section name</label>
            <input
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="e.g. Equipment"
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => addSection(newSectionName)}>
              Add section
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setAddingSection(false); setNewSectionName(""); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setAddingSection(true)}>
            + Add section
          </button>
        </div>
      )}
      {sections.map((section) => (
        <div key={section} className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{section}</h2>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ fontSize: "0.8rem" }}
              onClick={() => { if (confirm(`Remove section "${section}" and all its entries?`)) removeSection(section); }}
            >
              Remove section
            </button>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {(data[section] || []).map((entry, index) => (
              <li key={`${entry.id}-${index}`} style={{ marginBottom: "0.5rem", padding: "0.5rem", background: "rgba(0,0,0,0.03)", borderRadius: 6 }}>
                {editing?.section === section && editing?.index === index ? (
                  <ResourceEntryForm
                    entry={entry}
                    onSave={(updates) => { updateEntry(section, index, updates); setEditing(null); }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong>{entry.title}</strong>
                      {entry.type && <span style={{ color: "var(--color-muted)", marginLeft: "0.25rem" }}>({entry.type})</span>}
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "var(--color-muted)" }}>{entry.description || "—"}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => setEditing({ section, index })}>Edit</button>
                      <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.8rem", color: "#b91c1c" }} onClick={() => { if (confirm("Remove this entry?")) removeEntry(section, index); }}>Remove</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <ResourceAddEntryForm section={section} onAdd={(entry) => addEntry(section, entry)} />
        </div>
      ))}
    </>
  );
}

function ResourceEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: ResourceEntry;
  onSave: (updates: Partial<ResourceEntry>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(entry);
  const [pillsStr, setPillsStr] = useState((entry.pills || []).join(", "));

  function handleSave() {
    const pills = pillsStr.trim() ? pillsStr.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    onSave({ ...form, pills });
  }

  return (
    <div className="admin-card" style={{ marginTop: "0.5rem" }}>
      <div className="admin-form-group">
        <label>ID (slug)</label>
        <input value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="ag-1" />
      </div>
      <div className="admin-form-group">
        <label>Title</label>
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="admin-form-group">
        <label>Type (optional)</label>
        <input value={form.type ?? ""} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value || null }))} placeholder="Agency, Class, Theatre…" />
      </div>
      <div className="admin-form-group">
        <label>Subcategory (optional)</label>
        <input value={form.subcategory ?? ""} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value || null }))} />
      </div>
      <div className="admin-form-group">
        <label>Description</label>
        <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))} />
      </div>
      <div className="admin-form-group">
        <label>Location (optional)</label>
        <input value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value || null }))} />
      </div>
      <div className="admin-form-group">
        <label>Link (optional)</label>
        <input type="url" value={form.link ?? ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value || null }))} />
      </div>
      <div className="admin-form-group">
        <label>IMDb link (optional)</label>
        <input type="url" value={form.imdbLink ?? ""} onChange={(e) => setForm((f) => ({ ...f, imdbLink: e.target.value || null }))} />
      </div>
      <div className="admin-form-group">
        <label>Schedule (optional)</label>
        <input value={form.schedule ?? ""} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value || null }))} placeholder="e.g. First Friday 8–10 a.m." />
      </div>
      <div className="admin-form-group">
        <label>
          <input type="checkbox" checked={form.vendor ?? false} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.checked }))} />
          {" "}Vendor (equipment/services)
        </label>
      </div>
      <div className="admin-form-group">
        <label>Pills (optional, comma-separated)</label>
        <input value={pillsStr} onChange={(e) => setPillsStr(e.target.value)} placeholder="First class free, Scholarships" />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" className="admin-btn admin-btn-primary" onClick={handleSave}>Save</button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ResourceAddEntryForm({ section, onAdd }: { section: string; onAdd: (entry: ResourceEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ResourceEntry>>({
    id: "",
    title: "",
    subcategory: null,
    type: null,
    description: null,
    location: null,
    link: null,
    imdbLink: null,
    vendor: false,
    pills: undefined,
    schedule: null,
  });
  const [pillsStr, setPillsStr] = useState("");

  function handleAdd() {
    if (!form.id?.trim() || !form.title?.trim()) return;
    const pills = pillsStr.trim() ? pillsStr.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    onAdd({
      id: form.id.trim(),
      title: form.title.trim(),
      subcategory: form.subcategory || null,
      type: form.type || null,
      description: form.description || null,
      location: form.location || null,
      link: form.link || null,
      imdbLink: form.imdbLink || null,
      vendor: form.vendor ?? false,
      pills,
      schedule: form.schedule || null,
    });
    setForm({ id: "", title: "", subcategory: null, type: null, description: null, location: null, link: null, imdbLink: null, vendor: false, pills: undefined, schedule: null });
    setPillsStr("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" className="admin-btn admin-btn-secondary" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }} onClick={() => setOpen(true)}>
        + Add entry to {section}
      </button>
    );
  }
  return (
    <div className="admin-card" style={{ marginTop: "0.75rem" }}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>New entry</h3>
      <div className="admin-form-group"><label>ID (slug)</label><input value={form.id ?? ""} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="ag-1" /></div>
      <div className="admin-form-group"><label>Title</label><input value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
      <div className="admin-form-group"><label>Type (optional)</label><input value={form.type ?? ""} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value || null }))} /></div>
      <div className="admin-form-group"><label>Description (optional)</label><textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))} /></div>
      <div className="admin-form-group"><label>Location (optional)</label><input value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value || null }))} /></div>
      <div className="admin-form-group"><label>Link (optional)</label><input type="url" value={form.link ?? ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value || null }))} /></div>
      <div className="admin-form-group"><label>Pills (optional, comma-separated)</label><input value={pillsStr} onChange={(e) => setPillsStr(e.target.value)} /></div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" className="admin-btn admin-btn-primary" onClick={handleAdd}>Add entry</button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
