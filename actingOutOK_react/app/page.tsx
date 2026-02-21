import Link from "next/link";

export default function HomePage() {
  return (
    <div className="splash-page">
      <main className="splash" role="main">
        <Link
          href="/casting-calls"
          className="splash-bar"
          aria-label="Casting Calls"
        >
          <div className="splash-bar-letters" aria-hidden>
            <span>C</span>
            <span>A</span>
            <span>S</span>
            <span>T</span>
            <span>I</span>
            <span>N</span>
            <span>G</span>
            <span className="splash-bar-word-gap" />
            <span>C</span>
            <span>A</span>
            <span>L</span>
            <span>L</span>
            <span>S</span>
          </div>
          <div className="splash-bar-content">
            <p className="splash-bar-desc">
              Find auditions and opportunities across Oklahoma. Filter by age,
              location, and pay.
            </p>
          </div>
        </Link>
        <Link href="/resources" className="splash-bar" aria-label="Resources">
          <div className="splash-bar-letters" aria-hidden>
            <span>R</span>
            <span>E</span>
            <span>S</span>
            <span>O</span>
            <span>U</span>
            <span>R</span>
            <span>C</span>
            <span>E</span>
            <span>S</span>
          </div>
          <div className="splash-bar-content">
            <p className="splash-bar-desc">
              Classes, coaches, VO setups, and vendors to help you get started.
            </p>
          </div>
        </Link>
        <div className="splash-directory">
          <Link href="/directory/cast" className="splash-bar splash-bar-cast" aria-label="Cast directory">
            <div className="splash-bar-letters" aria-hidden>
              <span>C</span>
              <span>A</span>
              <span>S</span>
              <span>T</span>
            </div>
            <div className="splash-bar-content">
              <p className="splash-bar-desc">
                Talent in Oklahoma. Actors with profiles, credits, and contact info.
              </p>
            </div>
          </Link>
          <Link href="/directory/crew" className="splash-bar splash-bar-crew" aria-label="Crew directory">
            <div className="splash-bar-letters" aria-hidden>
              <span>C</span>
              <span>R</span>
              <span>E</span>
              <span>W</span>
            </div>
            <div className="splash-bar-content">
              <p className="splash-bar-desc">
                Crew and specialists: intimacy coordinators, directors, grips, and more.
              </p>
            </div>
          </Link>
        </div>
        <a
          href="https://news.actingoutok.com"
          className="splash-bar"
          aria-label="News"
        >
          <div className="splash-bar-letters" aria-hidden>
            <span>N</span>
            <span>E</span>
            <span>W</span>
            <span>S</span>
          </div>
          <div className="splash-bar-content">
            <p className="splash-bar-desc">
              Spotlights on actors, productions, and what&apos;s happening in
              Oklahoma film.
            </p>
          </div>
        </a>
      </main>

      <footer className="splash-footer">
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/submit-news">Suggest a news story</Link>
        <Link href="/report-issue">Report an issue</Link>
      </footer>
    </div>
  );
}
