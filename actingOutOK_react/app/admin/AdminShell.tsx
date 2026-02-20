"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-brand">
            Acting Out OK
          </Link>
          <span className="admin-brand-sub">Admin</span>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className="admin-nav-link">
            Dashboard
          </Link>
          <Link href="/admin/directory" className="admin-nav-link">
            Directory
          </Link>
          <Link href="/" className="admin-nav-link admin-nav-external" target="_blank" rel="noopener noreferrer">
            View site →
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <LogoutButton />
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
