import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">Acting Out OK</div>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              margin: 0,
            }}
          >
            Your first stop for acting in Oklahoma.
          </p>
        </div>
        <div className="footer-section">
          <h4>Explore</h4>
          <ul className="footer-links">
            <li>
              <Link href="/casting-calls">Casting Calls</Link>
            </li>
            <li>
              <Link href="/resources">Resources</Link>
            </li>
            <li>
              <Link href="/directory">Directory</Link>
            </li>
            <li>
              <a
                href="https://news.actingoutok.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                News
              </a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Info</h4>
          <ul className="footer-links">
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <li>
              <Link href="/submit-news">Suggest a news story</Link>
            </li>
            <li>
              <Link href="/report-issue">Report an issue</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
