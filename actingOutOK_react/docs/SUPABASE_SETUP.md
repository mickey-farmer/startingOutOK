# Supabase setup for Acting Out OK

The app can use **Supabase** as the database for Cast, Crew, Resources, and Casting Calls. When Supabase is configured, the admin tool writes to Supabase and the site reads from it. When not configured, the app continues to use the static JSON files in `public/data/` and the admin saves to GitHub (existing behavior).

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Create a **New project**: choose an organization, name, database password, and region.
3. Wait for the project to be ready.

---

## 2. Run the schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Open the file **`supabase/schema.sql`** in this repo and copy its full contents.
3. Paste into a new query and click **Run**.

This creates:

- **`cast`** – Talent directory (id, name, pronouns, description, link, contact_link, contact_label, email, instagram, other_links, tmdb_person_id, photo_url, credits, etc.)
- **`crew`** – Crew directory by section (section, id, name, pronouns, description, link, contact_link, contact_label, pills, etc.)
- **`resources`** – Resources by section (section, id, title, type, description, location, link, imdb_link, vendor, pills, schedule, etc.)
- **`casting_calls`** – Casting calls list + detail (slug, title, date, audition_deadline, location, roles, archived, etc.)

RLS is enabled with **select allowed for all**; only the **service role** (used by your API) can insert/update/delete.

---

## 3. Get your keys

1. In the dashboard go to **Project Settings** → **API**.
2. Copy:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **service_role** key (under “Project API keys”) – keep this secret; it bypasses RLS.

---

## 4. Configure the app

Add these to your environment (e.g. `.env.local` for local dev, and your host’s env for production, e.g. Vercel):

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- **Do not** put the service role key in client-side code or in `NEXT_PUBLIC_*` variables. It is only used in API routes and server-side code.
- After adding env vars, restart the dev server or redeploy.

**Production (Vercel):** The app only reads from Supabase when **both** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in **Vercel** → Project → Settings → Environment Variables (for Production and/or Preview). If they are missing in production, the site uses the static JSON files in `public/data/` (casting-calls.json, casting-calls/*.json, etc.) instead.

**If env vars are set but the site still shows old/deleted data:** After redeploying, open your production site → **DevTools → Network** → reload the Casting Calls page → click the request to `/api/data/casting-calls` → check **Response Headers** for **`X-Data-Source`**. If it says **`json`**, the server is not using Supabase (env not applied to that deployment, or wrong env scope). If it says **`supabase`**, the API is reading from Supabase; then confirm the URL points to the same Supabase project where you made changes, and try **Redeploy** with **Clear cache** in Vercel.

---

## 5. Behavior when Supabase is configured

- **Reading data**  
  All directory, resources, and casting-calls data is read from Supabase via the existing **`/api/data/*`** routes (directory, resources, casting-calls, casting-calls/[slug]). The frontend already uses these APIs.

- **Admin saves**  
  When both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, the admin tool:
  - **Cast / Crew** – Sends the full directory to `POST /api/admin/supabase/directory` (replaces `cast` and `crew` tables).
  - **Resources** – Sends the full resources object to `POST /api/admin/supabase/resources` (replaces `resources` table).
  - **Casting calls** – Uses:
    - `POST /api/admin/supabase/casting-calls` to upsert one casting call (add or edit).
    - `PATCH /api/admin/supabase/casting-calls/patch` to set archived.
    - `DELETE /api/admin/supabase/casting-calls/delete?slug=...` to remove a call.

- **When Supabase is not set**  
  The app keeps using the JSON files in `public/data/` and the admin keeps saving to GitHub via the existing save API.

---

## 6. Migrating existing data into Supabase

You have two options:

**Option A – Use the admin UI (after Supabase has data)**

Once Supabase is populated (e.g. via Option B), use the admin as usual to edit and save. Each save updates the database.

**Option B – One-time seed script**

From the `actingOutOK_react` directory run:

```bash
SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/seed-supabase.mjs
```

This reads `public/data/directory.json`, `resources.json`, `casting-calls.json`, and each `public/data/casting-calls/*.json`, clears the four Supabase tables, and inserts the data. You can run it again to reset and re-seed.

---

## 7. Optional: GitHub save when using Supabase

Right now, when Supabase is configured, the admin only writes to Supabase (no GitHub commit). If you want to also persist to GitHub (e.g. for backup or static build), we can add a “Save to repo” action that still calls the existing `/api/admin/save` with the current payload so both DB and repo stay in sync.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Create a Supabase project. |
| 2 | Run `supabase/schema.sql` in the SQL Editor. |
| 3 | Copy Project URL and `service_role` key from Project Settings → API. |
| 4 | Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your env. |
| 5 | Restart the app; admin saves will go to Supabase and the site will read from it. |
| 6 | Migrate existing data via admin (open each section and Save) or a one-time seed script. |
