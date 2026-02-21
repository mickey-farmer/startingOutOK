# Contact form (Supabase + Resend + Turnstile)

The contact page (`/contact`) stores each submission in Supabase and then sends an email via [Resend](https://resend.com) to `mickey@mickeyonstage.com`. It uses Cloudflare Turnstile for bot protection and requires accepting the Terms of Service.

**Flow:** Validate → save to `contact_submissions` table → send email. If Supabase or Resend is not configured, the form returns an error.

## Database

Submissions are stored in `public.contact_submissions` (see `supabase/schema.sql`). Columns: `id`, `created_at`, `name`, `email`, `type`, `payload` (JSONB with type-specific fields). Run the schema in the Supabase SQL Editor if you haven’t already (the `contact_submissions` block and RLS for it).

## Environment variables

- **SUPABASE_URL** and **SUPABASE_SERVICE_ROLE_KEY** (required for contact form) – So the server can insert into `contact_submissions`.
- **RESEND_API_KEY** (required) – Resend API key for sending email.
- **TURNSTILE_SECRET_KEY** (required) – Cloudflare Turnstile secret key for server-side verification.
- **CONTACT_EMAIL** (optional) – Override recipient; default `mickey@mickeyonstage.com`.
- **RESEND_FROM_EMAIL** (optional) – From address; default `Acting Out OK <onboarding@resend.dev>` (Resend sandbox).
- **NEXT_PUBLIC_TURNSTILE_SITE_KEY** (optional) – Turnstile widget site key; default is set in code.

## Supabase secrets (if using Supabase)

If you run this app with Supabase (e.g. Edge Functions or need to store secrets in Supabase):

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
```

Do **not** commit the API key. Set it in your deployment environment (Vercel, etc.) or via Supabase secrets as above.

## Resend setup

1. Sign up at [resend.com](https://resend.com).
2. Create an API key in the dashboard.
3. For production, verify your domain in Resend and set `RESEND_FROM_EMAIL` to e.g. `Acting Out OK <noreply@yourdomain.com>`.

## Turnstile setup

1. Create a Turnstile widget in the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/turnstile).
2. Use the **site key** in the widget (or set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
3. Use the **secret key** as `TURNSTILE_SECRET_KEY` (server-side only).

## Next steps & testing

1. **Set env vars** (in `.env.local` for dev, and in your host for production):
   - `SUPABASE_URL` – from Supabase Dashboard → Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` – same page (keep secret).
   - `RESEND_API_KEY` – from [Resend](https://resend.com).
   - `TURNSTILE_SECRET_KEY` – from Cloudflare Turnstile.

2. **Restart the dev server** after changing env vars (`npm run dev`).

3. **Test the form:** Open `/contact`, pick a type, fill required fields, complete Turnstile, accept TOS, and submit.

4. **Verify:** In Supabase → Table Editor → `contact_submissions`, you should see a new row. In your inbox (mickey@mickeyonstage.com), you should receive the email.
