# FastBreak Sports Event Management

## What I Built
I built a full-stack sports event management app where authenticated users can create, edit, view, search, filter, and delete events with venue details. The app supports multiple venues per event, image upload, fallback event images, and two dashboard views (card/table) with pagination.


## Thought Process
I approached this project in layers so the most critical foundations were stable first.

1. Identity and access first.
I started with Supabase Auth + protected routes because every feature depends on a user context. I wanted all event data to be user-scoped from day one.

2. Data model before UI complexity.
I designed `events`, `venues`, and `event_venues` for many-to-many support. Later, I added `sports` so users can choose from defaults and add custom sports without breaking form UX.

3. Server-first data flow.
I intentionally kept all DB/storage operations on the server using Server Actions and Server Components. This matches the requirement and keeps credentials and permissions away from client components.

4. UX iteration after correctness.
Once CRUD worked, I improved flow and usability: filter/search, card-table view switch, pagination, create-event modal, image previews, and clearer error feedback.

## Architecture Decisions
### 1) Server Actions for mutations
All create/update/delete/auth operations are in server actions with a shared typed result contract. This gave me consistent success/error handling and reduced repeated try/catch logic in client components.

### 2) Server Components for read-heavy screens
Dashboard/event pages fetch data server-side. Query params control filters/view/page so state is shareable via URL.

### 3) Typed action helper
I added a reusable `ActionResult` pattern for predictable responses:
- success payload + optional message
- typed error code + human-readable message

### 4) Supabase Storage for event images
Users can upload event images, which are stored in a user-scoped path. If no image is uploaded, I fetch a fallback image from a free API (Pexels) using event name + sport keywords.

## Trade-offs I Considered
1. **Action-first simplicity vs API abstraction**
I prioritized Server Actions for speed and requirement alignment. A larger production system might add a dedicated domain/service layer for broader reuse.

2. **URL-driven filtering vs local-only state**
Using URL params makes dashboard state shareable and refresh-safe, but each filter update triggers navigation. It is practical and clear, but can be further optimized with debounce.

3. **Flexible sport type (`text`) vs strict enum**
I moved away from strict enum behavior because users can add custom sports. This improves product flexibility but gives up enum-level DB constraints.

4. **Modal create flow vs separate page**
I switched to modal creation for faster user workflow. The trade-off is tighter layout management (sticky header/footer, scroll handling).

## Security and Data Rules
- RLS policies enforce user-level access
- Server-side auth checks before mutations
- Storage object paths scoped to authenticated user id
- File type and size checks for uploads
- Cleanup of old uploaded images on event update/delete

## Key Features Implemented
- Email/password + Google sign-in
- Protected routes + logout
- Event CRUD with multiple venues
- Sport dropdown + add custom sport
- Search/filter (name, date, location, sport)
- Reset filters control
- Card/Table view switch with pagination
- Event image upload + fallback image logic
- Loading states + toast notifications + improved human error messages

## Setup
1. Install dependencies:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env.local
```

3. Set env values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
- `NEXT_PUBLIC_SITE_URL`
- `PEXELS_API_KEY` (optional fallback image support)

4. Run SQL schema in Supabase SQL editor:
- `src/db/schema.sql`

5. Start app:
```bash
npm run dev
```

## What I Would Improve Next
- Replace `<img>` with Next `<Image>` for optimization
- Debounced filters for lower navigation churn
- Tests for server actions and dashboard flows
- Better deduplication strategy for reusable venues


# my approach summary

I started this project by understanding the real user flow first instead of jumping straight into coding. The app had to feel practical for a sports organizer: login quickly, create events fast, search clearly, and manage updates without confusion. Based on that, I decided to build the system in a server-first way so all sensitive operations stay secure and consistent.

My first priority was authentication and route protection, because the rest of the app depends on user identity. After that, I designed the data model with events, venues, event-venues mapping, and sports types. I kept it simple but extensible, so custom sport types and multiple venues per event were easy to support.

For implementation, I used Server Actions for create, update, delete, and auth operations. Reads are handled through Server Components. This made data flow predictable and helped avoid client-side database exposure. I also added a reusable action response pattern for consistent success and error handling across the app.

On the UI side, I focused on usability over decoration. I used shadcn form patterns with react-hook-form and zod validation, then improved labels, required markers, human-friendly errors, and toast feedback. I moved create event into a modal so users can stay on the dashboard and work faster.

As features evolved, I added search by event name, location, and date, plus sport filters. I also added a reset button so users can quickly clear filters anytime. I included both card and table view options so users can understand and browse events in the style they prefer.

In event creation, users can upload images to Supabase Storage so each event is visually clear, and I also integrated a free open API fallback so if no image is uploaded, the app automatically fetches an event-name-based image and shows a useful dummy/fallback visual.

Finally, I refined spacing, card sizing, modern filter bar styling, and empty-state visuals based on iterative feedback. My goal throughout was to keep the product clean, practical, and production-minded while still being easy for a recruiter or team to review.

I kept naming and folder structure straightforward so reviewers understand responsibilities quickly and can contribute without long onboarding effort.

App Link : https://event-app-green-chi.vercel.app/

