"use client";

import { useState, useEffect, useCallback } from "react";

type DirectoryEntry = {
  id: string;
  name: string;
  pronouns?: string | null;
  description: string;
  location?: string | null;
  link?: string | null;
  contactLink?: string | null;
  contactLabel?: string | null;
  pills?: string[];
};

type DirectoryData = Record<string, DirectoryEntry[]>;

const CREW_SECTION_ORDER = [
  "Directors",
  "Writers",
  "Camera Operators",
  "Photographers",
  "PAs",
  "Props",
  "Stunt Coordinators",
  "Intimacy Coordinators",
  "Costume",
  "Editors",
  "Gaffer",
  "Grips",
  "Hair & Make-Up",
  "Production Design",
  "Script Supervisor",
  "Sound",
];

function sectionSort(a: string, b: string): number {
  const i = CREW_SECTION_ORDER.indexOf(a);
  const j = CREW_SECTION_ORDER.indexOf(b);
  if (i !== -1 && j !== -1) return i - j;
  if (i !== -1) return -1;
  if (j !== -1) return 1;
  return a.localeCompare(b);
}

export default function AdminCrewPage() {
  const [data, setData] = useState<DirectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [editing, setEditing] = useState<{ section: string; index: number } | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

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

  async function handleSave(newData: DirectoryData) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          path: "public/data/directory.json",
          content: JSON.stringify(newData, null, 2),
          message: "Admin: update crew directory",
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: result.error || "Save failed" });
        return;
      }
      setMessage({ type: "success", text: "Saved. Site will update after deploy." });
      setData(newData);
      setEditing(null);
      setAddingSection(false);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  function updateEntry(section: string, index: number, updates: Partial<DirectoryEntry>) {
    if (!data) return;
    const sectionEntries = [...(data[section] || [])];
    sectionEntries[index] = { ...sectionEntries[index], ...updates };
    const next: DirectoryData = { ...data, [section]: sectionEntries };
    setData(next);
  }

  function addEntry(section: string, entry: DirectoryEntry) {
    if (!data) return;
    const sectionEntries = [...(data[section] || []), entry];
    const next: DirectoryData = { ...data, [section]: sectionEntries };
    setData(next);
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
        <h1 className="admin-page-title">Crew</h1>
        <p>{loading ? "Loading…" : "Failed to load directory."}</p>
      </div>
    );
  }

  const sections = Object.keys(data)
    .filter((s) => s !== "Talent")
    .sort(sectionSort);

  return (
    <>
      <h1 className="admin-page-title">Crew</h1>
      <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--color-muted)" }}>
        Crew sections (all except Talent). Edit sections and entries.
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
              placeholder="e.g. Sound Mixers"
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
                  <CrewEntryForm
                    entry={entry}
                    onSave={(updates) => { updateEntry(section, index, updates); setEditing(null); }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong>{entry.name}</strong>
                      {entry.pronouns && <span style={{ color: "var(--color-muted)", marginLeft: "0.25rem" }}>({entry.pronouns})</span>}
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "var(--color-muted)" }}>{entry.description}</p>
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
          <CrewAddEntryForm section={section} onAdd={(entry) => addEntry(section, entry)} />
        </div>
      ))}
    </>
  );
}

function CrewEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: DirectoryEntry;
  onSave: (updates: Partial<DirectoryEntry>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(entry);
  return (
    <div className="admin-card" style={{ marginTop: "0.5rem" }}>
      <div className="admin-form-group">
        <label>ID (slug)</label>
        <input value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="jane-doe" />
      </div>
      <div className="admin-form-group">
        <label>Name</label>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="admin-form-group">
        <label>Pronouns (optional)</label>
        <input value={form.pronouns ?? ""} onChange={(e) => setForm((f) => ({ ...f, pronouns: e.target.value || null }))} placeholder="she/her" />
      </div>
      <div className="admin-form-group">
        <label>Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="admin-form-group">
        <label>Link (optional)</label>
        <input type="url" value={form.link ?? ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value || null }))} />
      </div>
      <div className="admin-form-group">
        <label>Contact link (optional)</label>
        <input type="url" value={form.contactLink ?? ""} onChange={(e) => setForm((f) => ({ ...f, contactLink: e.target.value || null }))} />
      </div>
      <div className="admin-form-group">
        <label>Contact label (optional)</label>
        <input value={form.contactLabel ?? ""} onChange={(e) => setForm((f) => ({ ...f, contactLabel: e.target.value || null }))} placeholder="Instagram" />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function CrewAddEntryForm({ section, onAdd }: { section: string; onAdd: (entry: DirectoryEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<DirectoryEntry>>({
    id: "",
    name: "",
    pronouns: null,
    description: "",
    location: null,
    link: null,
    contactLink: null,
    contactLabel: null,
    pills: undefined,
  });

  function handleAdd() {
    if (!form.id?.trim() || !form.name?.trim() || !form.description?.trim()) return;
    onAdd({
      id: form.id.trim(),
      name: form.name.trim(),
      pronouns: form.pronouns || null,
      description: form.description.trim(),
      location: form.location || null,
      link: form.link || null,
      contactLink: form.contactLink || null,
      contactLabel: form.contactLabel || null,
      pills: form.pills?.length ? form.pills : undefined,
    });
    setForm({ id: "", name: "", pronouns: null, description: "", location: null, link: null, contactLink: null, contactLabel: null, pills: undefined });
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
      <div className="admin-form-group"><label>ID (slug)</label><input value={form.id ?? ""} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="jane-doe" /></div>
      <div className="admin-form-group"><label>Name</label><input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
      <div className="admin-form-group"><label>Pronouns (optional)</label><input value={form.pronouns ?? ""} onChange={(e) => setForm((f) => ({ ...f, pronouns: e.target.value || null }))} placeholder="she/her" /></div>
      <div className="admin-form-group"><label>Description</label><textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
      <div className="admin-form-group"><label>Link (optional)</label><input type="url" value={form.link ?? ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value || null }))} /></div>
      <div className="admin-form-group"><label>Contact link (optional)</label><input type="url" value={form.contactLink ?? ""} onChange={(e) => setForm((f) => ({ ...f, contactLink: e.target.value || null }))} /></div>
      <div className="admin-form-group"><label>Contact label (optional)</label><input value={form.contactLabel ?? ""} onChange={(e) => setForm((f) => ({ ...f, contactLabel: e.target.value || null }))} placeholder="Instagram" /></div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" className="admin-btn admin-btn-primary" onClick={handleAdd}>Add entry</button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
