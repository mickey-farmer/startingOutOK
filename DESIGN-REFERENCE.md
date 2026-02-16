# Acting Out OK – Design Reference

Quick reference for the **"Modern Professional"** palette and how each color and design choice is used across the site. Use this when updating the logo, adding new UI, or keeping the look consistent.

---

## Color Palette

| Name | Hex | CSS Variable | Where It’s Used |
|------|-----|--------------|-----------------|
| **Page background** | `#F1F3F5` | `--color-bg` | Main canvas; light gray so white logo and cards have clear separation. |
| **Surface / White** | `#ffffff` | `--color-bg-elevated`, `--color-surface` | Cards, header strip, sidebars; logo (ffffff) sits on these for contrast with page. |
| **Primary Text** | `#1A1A1B` | `--color-text` | Body copy, headings, primary UI text. |
| **Accent (SF Blue)** | `#007AFF` | `--color-accent` | Links, primary buttons, focus rings, nav highlight, Non-Union pill. |
| **Muted Text** | `#636E72` | `--color-text-muted` | Labels (e.g. “Date Posted”, “Location”), secondary copy, casting meta. |
| **Border / Stroke** | `#DFE6E9` | `--color-border` | Card borders, header bottom border, dividers, inputs. |

---

## Derived / Secondary Colors

| Purpose | Variable | Value | Use |
|---------|----------|--------|-----|
| Accent hover | `--color-accent-hover` | `#0066DD` | Link and button hover. |
| Accent muted (tint) | `--color-accent-muted` | `rgba(0, 122, 255, 0.15)` | Light blue tint for hover/focus backgrounds. |
| On accent | `--color-on-accent` | `#ffffff` | Text/icon on accent buttons. |
| Success | `--color-success` | `#16a34a` | Union pill, success states. |
| Warning | `--color-warning` | `#ca8a04` | Deadline text, caution. |

---

## Design Rules in Use

### 1. Borders, not heavy shadows

- **Cards (casting, list, detail):** `1px solid var(--color-border)` (`#DFE6E9`). No large drop shadows.
- **Header:** `1px solid var(--color-border)` on the bottom edge.
- Keeps the “Big Tech” look: sharp, clean separation without glare.

### 2. Monospace for data

- **Font variable:** `--font-mono` → JetBrains Mono (fallback: Roboto Mono, system monospace).
- **Used for:** Casting meta (pay, location, date, type, union, etc.) on:
  - `.casting-card .casting-meta`
  - `.casting-list-card .casting-list-meta`
  - `.casting-role-meta`
- Makes fields like “PAY: $500/DAY”, “LOCATION: OKC”, “DATE: 02.15.2026” feel parsed and official.

### 3. Glassmorphism header

- **Background:** `rgba(255, 255, 255, 0.9)` (white, 90% opacity) so the logo (ffffff) sits on a white strip over the gray page.
- **Blur:** `backdrop-filter: blur(10px)` (and `-webkit-backdrop-filter` for Safari).
- **Border:** `1px solid var(--color-border)` (`#DFE6E9`) on the bottom.
- **Position:** `position: sticky; top: 0`.
- Keeps the header light and “chill” while content scrolls underneath.

---

## Typography

| Role | Variable | Font | Use |
|------|----------|------|-----|
| Body / UI | `--font-sans` | DM Sans | Body text, buttons, form labels. |
| Display / headings | `--font-display` | Outfit | Page titles, card titles, nav. |
| Data / technical | `--font-mono` | JetBrains Mono | Casting meta (pay, location, date, type). |

---

## Pills (casting calls)

| Pill | Background | Text | Variable (bg / text) |
|------|------------|------|----------------------|
| Union | Light green | Green | `--color-pill-union-bg` / `--color-pill-union` |
| Non-Union | Light blue | SF Blue | `--color-pill-nonunion-bg` / `--color-pill-nonunion` |
| Mixed | Light gray | Muted | `--color-pill-mixed-bg` / `--color-pill-mixed` |
| Under 18 | Light orange | Orange | `--color-pill-under18-bg` / `--color-pill-under18` |

---

## Splash / home bars

- **Casting:** `--bar-casting` → `#007AFF` (same as accent).
- **Resources:** `--bar-resources` → `#0d9488`.
- **News:** `--bar-news` → `#c026d3`.

---

## File reference

- **Colors & tokens:** `css/variables.css`
- **Header (glassmorphism):** `css/main.css` (`.site-header`)
- **Casting cards & borders:** `css/pages.css` (`.casting-card`, `.casting-list-card`, meta/mono)
- **Font import (DM Sans, Outfit, JetBrains Mono):** `css/main.css` (top)

When in doubt, use the CSS variables from `variables.css` so one change there keeps the whole site consistent.
