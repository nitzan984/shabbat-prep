# Family sharing: assignees, weekday tasks, classes and events

Branch: `feature/family-tasks` · Status: **done 2026-11-27**

## Request (user's words, translated)
1. Assign a task to שיר, מיכל or איתן.
2. Manage tasks for regular weekdays, in a view separate from the Shabbat view.
3. Everyone who uses the app sees everything (shared across devices).
4. Add classes (חוגים) and events up to a month ahead, for one person or the whole family.
5. (added mid-build) Fix the layout and navigation on the phone, which is ~80% of use; on Android it should feel like a real app.

## Current state (researched)
- All user data lives in `localStorage` stores (`src/hooks/useCheckList.ts`, `useRecipes.ts`, `useLayout.ts`, `useTimer.ts`); nothing is shared between devices.
- Server state goes through the small query cache in `src/lib/query.ts` (Hebcal, Open-Meteo), with `persist` and `refetchInterval` already supported. No mutations yet.
- Deployed on Vercel, auto-deploy from GitHub `main`; every other branch gets a preview URL.
- Supabase org (via Vercel integration) is on the **free plan**: 2 existing projects, both paused (`house-hold`, `supabase-rose-car`), not touched by this plan. New project cost: **$0/month**. Free projects pause after 7 days without activity.

## Design
**Backend:** new Supabase project `shabbat-prep`. Accessed with plain `fetch` to PostgREST from `src/services/` (no `supabase-js`, keeps the "no heavy libraries" rule).

**Access:** a family code, sent as header `x-family-code`. RLS on every table: `household_id = app_household_id()`, where `app_household_id()` (security definer) maps `sha256(code)` to a household. Without a valid code: no rows, no writes. A separate test household is used by automated tests. Invite link `/#code=...` stores the code on the device and strips it from the address bar.

**Tables** (all with `household_id`, `created_at`, `updated_at`):
- `households(id, name, code_hash)`. No API access.
- `tasks(id, list 'shabbat'|'weekday', text, done, assignee 'shir'|'michal'|'eitan'|null, due_date date|null, position)`
- `checklist_items(id, text, done, position)`
- `recipes(id, name, category, prep_minutes, servings, timer_minutes, ingredients text[], steps text[], in_menu)`
- `events(id, title, person 'shir'|'michal'|'eitan'|null=whole family, kind 'class'|'event', date, start_time|null, end_time|null, repeat 'none'|'weekly', repeat_until date|null, skip_dates date[], notes|null)`

**Sync:** shared lists are server state. Optimistic update → request → revert with a toast on failure. Refetch every 10 s while the page is visible, and immediately on focus. Last data is cached in `localStorage` for a fast first paint.

**Per device (not shared):** timer, widget order/visibility, last view, person filter.

**Views:** a switch at the top: `הכנות לשבת | השבוע`. Opens on `השבוע` Sunday to Thursday and on `הכנות לשבת` Friday and Saturday; the hash (`#/week`, `#/shabbat`) overrides.
- `השבוע`: person filter (הכל · שיר · מיכל · איתן), week navigation (previous / this week / next, up to 5 weeks ahead), a card per day Sunday to Friday with that day's events (sorted by time) and tasks; a "חודש קדימה" list of all events in the next 30 days (all 7 days).
- Phone bottom nav in this view: א׳ ב׳ ג׳ ד׳ ה׳ ו׳ + חודש. Top bar on iPad/desktop, as today.
- Shabbat tasks widget: assignee chip on each task, assignee picker when adding.

## Phases (vertical slices, riskiest first)

### Phase 1: Backend and access control (S)
Verified when: `pnpm test:live` proves right code → rows; wrong or missing code → empty reads and rejected writes.
- Create project, apply migration (tables, RLS, `app_household_id()`, `updated_at` trigger), seed the family household (default checklist + 5 recipes) and a test household.
- Files: `supabase/migrations/001_init.sql`, `src/services/live.test.ts`, `.env.local` (not committed).
- Blocked by: approval.

### Phase 2: Shared Shabbat tasks with assignees (M)
Verified when: unit tests pass; in two browser tabs a task added/ticked/assigned in one appears in the other within 10 s.
- `src/services/db.ts` (typed PostgREST client), `src/services/tasks.ts`, mutations + `setData` in `src/lib/query.ts`, `src/hooks/useFamilyCode.ts` (code entry card + invite link), `src/hooks/useCheckList.ts` → tasks via server, `TasksWidget`/`ItemList` assignee chip and picker, `SummaryChips`.
- Blocked by: 1.

### Phase 3: Shared checklist and recipes (S)
Verified when: checklist reset and recipe edit in one tab show in the other; local-only stores for them are removed.
- `src/services/checklist.ts`, `src/services/recipes.ts`, `useCheckList.ts`, `useRecipes.ts`.
- Blocked by: 2.

### Phase 4: Phone app shell (M) — added mid-build
Verified when: at 375px each bottom tab opens its own screen (שבת · משימות · השבוע · מתכונים · טיימר), compact sticky top bar, no horizontal scroll; iPad/desktop keep the widget board with a top switch `הכנות לשבת | השבוע`.
- `src/hooks/useRoute.ts`, `src/hooks/useMedia.ts`, `src/components/shell/*`, `AppNav.tsx`, `App.tsx`, `styles.css`; remove scroll-spy `useActiveSection.ts`.
- Blocked by: 3.

### Phase 4b: Week view with weekday tasks (M)
Verified when: switching views works by click, by hash and by day-of-week default; tasks per day add/tick/assign/filter; nav items follow the view on phone and desktop.
- `src/hooks/useView.ts`, `src/lib/week.ts` (week ranges), `src/components/week/*`, `AppNav.tsx`, `SiteHeader.tsx`, `App.tsx`, `styles.css`.
- Blocked by: 2.

### Phase 5: Classes and events (M)
Verified when: unit tests for occurrence expansion (weekly, until date, skipped dates, month range); a class for שיר every Tuesday 16:00 shows on each Tuesday in the week view and in "חודש קדימה"; cancelling one date hides only that date.
- `src/services/events.ts`, `src/lib/occurrences.ts` (+ test), `src/hooks/useEvents.ts`, `src/components/week/EventForm.tsx`, `DayCard.tsx`, `MonthAgenda.tsx`.
- Blocked by: 4.

### Phase 6b: Installable Android app (S) — added mid-build
Verified when: Chrome reports the manifest installable; an install button appears on Android; app opens standalone and loads offline (app shell).
- `public/manifest.webmanifest`, `public/icons/*`, `public/sw.js`, `src/lib/pwa.ts`, install entry in the menu.
- Blocked by: 4.

### Phase 6: Deploy (S)
Verified when: preview URL works on phone and iPad sizes with the family code; after the user approves the merge, production does too.
- Vercel env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) for Production/Preview/Development; daily keep-alive cron (`api/keepalive.ts`, `vercel.json`) so the free project does not pause; README; PR to `main`.
- Blocked by: 3, 5.

## Decision log
| Decision | Chosen option | Why |
| --- | --- | --- |
| Backend | Supabase free project, plain fetch | $0, Postgres + RLS, already in the user's account; no client library |
| Access | Family code header + RLS, invite link | Keeps strangers with the URL out, no accounts for kids |
| Sync | Polling 10 s + on focus | Works with header-based RLS; realtime needs a manual dashboard setting |
| Shared vs local | Lists shared; timer, layout, view, filter per device | A shared timer would ring on every phone |
| Weekday tasks | One-off, per date | Simple; recurrence is for classes |
| Classes | Weekly repeat, optional end date, skip single dates | Covers חוגים and holidays |
| Existing local data | Not migrated; start from defaults | App is a few hours old |
| Phone layout | Bottom tabs switch screens (hash routes), not anchors in one long page | 80% phone use; app-like; short screens |
| Large screens | Keep widget board (drag/hide) + top switch | Original requirement; space is available |
| Android app | PWA (manifest, icons, service worker, install button), no Play Store | Installable today, no store account or native build |
| Week screen layout | Day picker strip + one day's agenda, month list below | Fits a phone; same on all sizes |
| `family_name()` advisor warning | Kept: security definer callable by anon | Returns only the name, and only for a valid code |

## Not yet specified
- Answers to the open questions in the approval message.

## Always / Never
- Always: Hebrew RTL, real buttons and labels, 44px targets, SVG icons, no `useEffect` without need, services/hooks/components layering, server state vs local state kept apart.
- Never (this plan): per-person accounts, push notifications, recurring tasks, shared timer, offline edit queue, touching the two existing Supabase projects, Play Store / native build.

## Progress
| Phase | Status |
| --- | --- |
| 1 Backend and access | done: project `jooyitcfpwuazgwzrrnn` (eu-central-1), RLS proven with curl (right code 10 rows; no/wrong code empty; writes without code 401; cross-household update 401) |
| 2 Shared Shabbat tasks | done: two tabs synced a task assigned to איתן and a checklist tick within 10 s; wrong code shows an error |
| 3 Shared checklist and recipes | done: both read from Supabase (10 items, 5 recipes seeded) |
| 4 Phone app shell | done: 5 tab screens at 375px, compact bar, settings sheet; wide board unchanged |
| 4b Week view | done (built together with 5) |
| 5 Classes and events | done: weekly class on Tuesdays, single-date cancel, family event, person filter; unit tests for expansion |
| 6b Android app (PWA) | done: manifest, icons incl. maskable, service worker, install button |
| 6 Deploy | done: env vars in all Vercel envs, keep-alive cron 200 on preview, merged to main |

## Execution record
- Shipped as planned, plus the mid-build phone shell and PWA (phases 4 and 6b).
- Deviations: week view and events were built in one slice (one screen); the Vercel CLI required `--type config` to confirm the `VITE_` publishable key is public.
- Verification: `pnpm build`, `pnpm test` (16 unit), `pnpm test:live` (7, incl. Supabase RLS on the test household), browser checks at 375px, 768px and 1180px, preview deployment checks with `vercel curl`.
