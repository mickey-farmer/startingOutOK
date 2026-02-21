import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <>
      <h1 className="admin-page-title">Dashboard</h1>
      <div className="admin-card">
        <p style={{ margin: 0, color: "var(--color-muted, #666)" }}>
          Manage content that is committed to the repo and deployed with the site.
        </p>
      </div>
      <div className="admin-card">
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 600 }}>
          Content
        </h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>
            <Link href="/admin/directory/cast" style={{ color: "var(--color-accent)" }}>
              Cast
            </Link>
            — Talent directory (alphabetical)
          </li>
          <li style={{ marginTop: "0.25rem" }}>
            <Link href="/admin/directory/crew" style={{ color: "var(--color-accent)" }}>
              Crew
            </Link>
            — Crew sections & entries
          </li>
          <li style={{ marginTop: "0.25rem" }}>
            <Link href="/admin/resources" style={{ color: "var(--color-accent)" }}>
              Resources
            </Link>
            — Agencies, classes, theaters, vendors, etc.
          </li>
          <li style={{ marginTop: "0.25rem" }}>
            <Link href="/admin/casting-calls" style={{ color: "var(--color-accent)" }}>
              Casting Calls
            </Link>
            — List and detail pages
          </li>
        </ul>
      </div>
    </>
  );
}
