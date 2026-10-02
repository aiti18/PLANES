# Supabase setup for PLANES

## 1. Create the project

Create a Supabase project, then open **SQL Editor** and run the complete file:

`supabase/migrations/001_initial_schema.sql`

This creates the application tables, profile trigger, RLS policies and the
private `avatars` bucket.

## 2. Authentication URL configuration

In **Authentication → URL Configuration** set:

- Site URL: `https://aiti18.github.io/PLANES/`
- Redirect URL: `https://aiti18.github.io/PLANES/`

For local development, also add the exact redirect URL used by Vite:

- `http://localhost:5173/PLANES/`

If authentication is tested through `npm run preview`, also add:

- `http://localhost:4173/PLANES/`

The app uses `HashRouter`, but the authentication callback targets the base
document. Supabase PKCE callback detection runs before React Router handles the
hash route.

## 3. Environment variables

Create `.env.local` from `.env.example`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

Use only the browser-safe anon/public or publishable key. Never place a secret
key or `service_role` key in a Vite environment variable.

## 4. GitHub Actions variables

Before production deployment, add the same two values as GitHub Actions
repository variables or secrets and expose them to the workflow build step.
That workflow change is intentionally deferred until the real project values
are available and tested locally.
