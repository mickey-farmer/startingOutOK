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
            <Link href="/admin/directory" style={{ color: "var(--color-accent)" }}>
              Directory
            </Link>
            — Cast & crew directory entries
          </li>
          <li style={{ marginTop: "0.25rem", color: "var(--color-muted)" }}>
            Resources — coming soon
          </li>
          <li style={{ marginTop: "0.25rem", color: "var(--color-muted)" }}>
            Casting calls — coming soon
          </li>
        </ul>
      </div>
    </>
  );
}
