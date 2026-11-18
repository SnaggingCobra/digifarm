# DigiFarm

DigiFarm is a farm management application built with Next.js, React, TypeScript, and Supabase. Farmers can manage their farm profile, crop records, farm expenses, and a short farm-task notebook. Each farmer's private records are protected by Supabase Row Level Security.

## Requirements

- Node.js compatible with the installed Next.js 16 release
- A Supabase project with the migrations in `supabase/migrations/` applied

## Local setup

Install dependencies and create `.env.local` with the Supabase project URL and a public client key:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported for projects still using the legacy anon key. Never put a service-role or secret key in a `NEXT_PUBLIC_` variable.

Then start the application:

```bash
npm install
npm run dev
```

## Database

Apply the migrations in `supabase/migrations/` to the linked Supabase project in timestamp order. Do not reset a project containing farmer data. The migrations create farmer profiles, crops, and expenses, with owner-scoped RLS policies.

Authentication email confirmation and password recovery require the Supabase Auth email settings and redirect URLs to include the local application origin.

## Checks

```bash
npm run lint
npm run build
```

The focused utility tests can be run with a Node.js version that supports TypeScript type stripping:

```bash
node --experimental-strip-types --test src/utils/supabase/auth.test.mjs
```

The current application does not yet record harvest quantities or revenue; those values are not presented as live farm statistics.