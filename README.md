# DailyFinance Pro

A Next.js 16 multi-company chit fund management application with Supabase authentication and Postgres row-level security.

## Run locally

```bash
npm install
npm run dev
```

Without environment variables the app starts in a safe, read-only-style demo workspace. To connect Supabase:

1. Create a Supabase project.
2. Run `supabase/migrations/202607170001_initial_multi_tenant.sql` in the SQL editor or with the Supabase CLI.
3. Copy `.env.example` to `.env.local` and add the project URL, publishable key, and server-only secret key.
4. Add `http://localhost:3000/auth/callback` and the production callback URL to Supabase Auth redirect URLs.
5. Start the app and use **Create company** to register the first owner.

## Authentication and tenancy model

- **Identity:** Supabase Auth owns email/password, confirmation, password reset, MFA, and cookie-backed sessions.
- **Company access:** `company_memberships` links a Supabase user to one or more companies. A role belongs to a membership, not to the user globally.
- **Roles:** owner, manager, collection agent, accountant, and viewer.
- **Authorization:** every financial row has a `company_id`. Postgres RLS verifies active membership on reads and role permissions on writes.
- **Invitations:** owners/managers call the server action, which uses the server-only Supabase secret to send an invite. The secret is never bundled into browser code.
- **Company switching:** the selected company is stored in an HTTP-only cookie, but the cookie is only UI context; RLS remains the security boundary.
- **Auditability:** important administrative and financial actions can be written to `audit_logs`.

Do not store authorization in `user_metadata`; users can edit it. The application reads current role/status from `company_memberships`. Custom JWT claims can be added later as a performance optimization, but the database membership remains the source of truth.

The original single-file prototype is preserved at `legacy/index.html`. The accepted dashboard concept is at `design/dailyfinance-next-concept.png`.
