# Acting Out OK

A static website for the Oklahoma film community: casting calls, resources, vendors, and news for anyone starting out in acting in Oklahoma.

## Features

- **Splash page** – Three vertical bars (Casting Calls, Resources, News) with smooth hover transitions
- **Casting Calls** – Single-role listings or **projects with multiple roles** (one project card with several role titles, descriptions, age ranges, pay). Optional **audition deadline**; calls expiring within 7 days are highlighted in an “Expiring within a week” section. Filterable by age, location, pay, type, union.
- **Resources** – Classes, coaches, VO setups; filterable by section, category, location
- **Vendors** – Equipment rentals and services; same filters as Resources
- **News** – Blog-style list of articles
- **About** – Your story; linked from footer
- **Privacy** – Template policy; update date and contact before publishing
- **Spotlight** – Announcements modal (same data on every page). A floating button in the lower-right opens a slide-up overlay with one-sentence updates (e.g. “Level up your stunts game at OFA March 15–20. Click here for more.”). Edit `data/spotlight.json` to add or remove items.

## Ordering

- **Casting calls** and **news** are shown in **reverse chronological order** (newest first). Each casting call and news entry should have a `date` (YYYY-MM-DD).
- **Resources** are **sectioned** (Resources vs Vendors) and **alphabetical by category, then by title** within each section.

## Tech

- Plain HTML, CSS, and JavaScript. Optional **Decap CMS** for editing content via a web UI (see below).
- Data in `data/*.json` (casting-calls, resources, news). A casting call can be a **single role** (flat fields) or a **project with multiple roles** (use a `roles` array; each role has `roleTitle`, `description`, `pay`, `ageRange`, `type`, `union`, etc.). You can edit these files directly, or use Decap CMS to edit `content/*` and run the build script to update `data/`.
- Designed for **GitHub Pages**: enable Pages on this repo (Settings → Pages → Source: main branch, / (root)). The `.nojekyll` file ensures static files are served as-is.

### Local development

Opening the HTML files directly via `file://` will **not** load the JSON data: browsers block `fetch()` to local files for security (CORS). To run the site locally with working casting calls, resources, and news:

- **Option A:** From the project root run `npx serve .` then open **http://localhost:3000** (or the port shown).
- **Option B:** Run `python3 -m http.server 8000` then open **http://localhost:8000**.

## SEO

Search engine setup is in the repo (titles, meta descriptions, `robots.txt`, `sitemap.xml`), not in GitHub. The casting-calls and home pages use titles and descriptions aimed at queries like “Oklahoma casting calls.”

**After you deploy:** Replace the placeholder in `sitemap.xml` with your live site base URL (e.g. `https://yoursite.github.io/actingOutOK` or your custom domain). Then uncomment and set the `Sitemap:` line in `robots.txt` to point to your full sitemap URL so search engines can discover all pages.

## Before you share

A quick checklist so the site runs well for visitors:

1. **Run it locally** – `npx serve .` then open the URL. Click through: Home → Casting Calls, Resources, News. Try a filter and the “Expiring soon” tab; open a news article; use the mobile menu.
2. **Submit forms** – Submit a casting call and a resource (you can use test data). Confirm you receive the Formspree email and that the thank-you page appears after submit.
3. **Share link** – On Casting Calls, click “Share” on a card. Paste the link in a new tab and confirm it opens to that call and scrolls to it.
4. **After deploy** – Set the base URL in `sitemap.xml` and the `Sitemap:` line in `robots.txt`. Optionally submit the sitemap in Google Search Console.
5. **Legal pages** – Update `privacy.html` (date, contact) and `about.html` if you haven’t already.

## Customization

- **Spotlight** – Edit `content/spotlight.json` in Decap (or `data/spotlight.json` if not using Decap). Each item can have `message` (required), `link` (optional URL), and `linkText` (optional, default “Learn more”). If the array is empty or the file is missing, the Spotlight button is hidden.
- **Colors** – Edit `css/variables.css`. Change `--color-accent`, `--color-bg`, section bar colors, etc.
- **About** – Edit `about.html` with your own journey and contact.
- **Privacy** – Edit `privacy.html`: set “Last updated” date and “[your contact email or form]”.
- **News articles** – Add individual pages under `news/` (e.g. `news/my-article.html`) and set the URL in `js/news.js` (replace the `url = "#"` line with the real path, or build URLs from `entry.slug`).
- **Submit a casting call (public form)** – The casting calls page links to `submit-casting.html`, where anyone can request that a casting call be added. Submissions are sent by email via **Formspree**. To enable it: (1) Sign up at [formspree.io](https://formspree.io), (2) Create a new form and set the notification email to the address that should receive submissions (e.g. `mickey@mickeyonstage.com`), (3) Copy your form ID from the form’s endpoint (e.g. `https://formspree.io/f/xyzabc` → `xyzabc`), (4) In `submit-casting.html`, replace `FORM_ID` in the form’s `action` attribute with your form ID. The email you receive will include the submitter’s name/email and a **Casting call JSON** field with the full listing data (ready to paste into `data/casting-calls.json` if you approve it).

## Structure

```
/
  admin/
    index.html        # Decap CMS entry (open /admin/ on the live site)
    config.yml        # Decap collections and backend (set repo)
  content/            # Source for Decap; build script copies to data/
    casting-calls/    # One .json per casting call
    news/
    resources/        # One .json per resource (section in file)
    spotlight.json    # { "items": [ { message, link, linkText } ] }
  index.html          # Splash
  casting-calls.html
  submit-casting.html # Public form to request a casting call listing (emails via Formspree)
  resources.html
  news.html
  about.html
  privacy.html
  css/
    variables.css
    main.css
    splash.css
    pages.css
    forms.css        # Submit resource / submit casting form styles
  js/
    casting-calls.js
    submit-casting.js
    submit-resource.js
    resources.js
    news.js
  data/               # Consumed by the site; generated from content/ by build-from-content.js
    casting-calls.json
    casting-calls/    # One .json per call (detail page)
    resources.json
    news.json
    news/
    spotlight.json
  feed.xml            # RSS feed (scripts/generate-feed.js)
  scripts/
    generate-feed.js
    build-from-content.js   # content/ → data/
    migrate-data-to-content.js  # One-time: data/ → content/
```

## License

Use and modify as you like for Acting Out OK.
