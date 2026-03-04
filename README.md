# TaskFlow Pro (PRD-based Build)

This project is a fresh rebuild based on your `TaskFlow_Pro_PRD.docx`, implemented with Next.js 15 App Router, TypeScript, Supabase, Tailwind CSS, and shadcn/ui.

## My Build Approach

I rebuilt the app in phases so the architecture stays clean:

1. Foundation first: route groups, global layout, middleware auth guard, Supabase SSR clients, and server action helper.
2. Data model second: PostgreSQL schema and RLS-ready tables for auth, projects, members, invitations, tickets, comments, chat, notifications, and sprints.
3. Product flows third: auth pages, dashboard, project space, ticket list/detail, chat, members/invite, notifications, and profile.
4. Quality pass: typecheck + lint clean before handoff.

## What’s Implemented

- Authentication
  - Email/password register + login
  - Google OAuth trigger
  - Magic link trigger
  - Logout
  - Protected routes with middleware
  - Single OAuth callback route handler: `src/app/auth/callback/route.ts`

- Project Management
  - Dashboard with user project list
  - Create project form (shadcn Form + react-hook-form + zod)
  - Project overview page

- Team Management
  - Member list
  - Invite member flow with role selection and token generation
  - Public invite accept page (`/invite/[token]`)

- Ticketing
  - Ticket list with server-side filters (title + status)
  - Board view grouped by status
  - Ticket create page
  - Ticket detail page
  - Comments on tickets

- Collaboration
  - Project chat page + send message
  - Notifications center + mark all read

- Profile
  - Update display name, bio, timezone

## Architecture Rules Followed

- Database writes/reads run server-side (Server Components + Server Actions)
- No direct Supabase data calls inside client components
- API routes avoided except OAuth callback route
- Reusable `safeAction` helper for consistent action result/error shape

## Run Locally

1. Set `.env.local` with Supabase keys and app URL.
2. Run schema from `src/db/schema.sql` in Supabase SQL editor.
3. Install and run:

```bash
npm install
npm run dev
```

## Notes

This is a clean v1 PRD implementation scaffold with core flows working end-to-end. Advanced PRD extras (drag-drop board, activity log UI, realtime subscriptions, DMs persistence, full reports charts) can be layered next on this structure.
