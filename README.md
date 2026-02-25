# My Approach

I started this project by understanding the real user flow first instead of jumping straight into coding. The app had to feel practical for a sports organizer: login quickly, create events fast, search clearly, and manage updates without confusion. Based on that, I decided to build the system in a server-first way so all sensitive operations stay secure and consistent.

My first priority was authentication and route protection, because the rest of the app depends on user identity. After that, I designed the data model with events, venues, event-venues mapping, and sports types. I kept it simple but extensible, so custom sport types and multiple venues per event were easy to support.

For implementation, I used Server Actions for create, update, delete, and auth operations. Reads are handled through Server Components. This made data flow predictable and helped avoid client-side database exposure. I also added a reusable action response pattern for consistent success and error handling across the app.

On the UI side, I focused on usability over decoration. I used shadcn form patterns with react-hook-form and zod validation, then improved labels, required markers, human-friendly errors, and toast feedback. I moved create event into a modal so users can stay on the dashboard and work faster.

As features evolved, I added search by event name, location, and date, plus sport filters. I also added a reset button so users can quickly clear filters anytime. I included both card and table view options so users can understand and browse events in the style they prefer.

In event creation, users can upload images to Supabase Storage so each event is visually clear, and I also integrated a free open API fallback so if no image is uploaded, the app automatically fetches an event-name-based image and shows a useful dummy/fallback visual.

Finally, I refined spacing, card sizing, modern filter bar styling, and empty-state visuals based on iterative feedback. My goal throughout was to keep the product clean, practical, and production-minded while still being easy for a recruiter or team to review.

I kept naming and folder structure straightforward so reviewers understand responsibilities quickly and can contribute without long onboarding effort.
# eventApp
