# Ritim Mobile App Map

Generated for the current Expo Router app structure.

Local preview:
- Static web export: `http://localhost:4174`
- Direct routes work through SPA fallback, for example `/home`, `/cards`, `/routine-plan?routineId=...`

## Boot And Access

- `/` checks local profile and Supabase session.
- If no usable profile/session exists: `/onboarding`
- If profile exists and access is valid: `/home`
- Most app routes call `hasAppAccess(profile, authUserId)` and redirect to `/onboarding` when access is missing.
- Root layout runs:
  - `AutoSyncRuntime`
  - `DeepLinkRuntime`
  - `Stack` with hidden headers

## Primary Navigation

Bottom navigation has 3 visible tabs:
- `Bugün` -> `/home`
- `Tara` -> `/mock-scan`
- `Profil` -> `/profile`

Dashboard drawer/menu links:
- `Bugün` -> `/home`
- `Planlar` -> `/routines`
- `Profil` -> `/profile`
- `Kartlarım` -> `/cards`
- `Aktivite Kütüphanesi` -> `/activity-library`
- `Geçmiş` -> `/history`
- `Fitness Girişi` -> `/manual-log?category=fitness`
- `Wellness` -> `/wellness`
- `NFC Ayarları` -> `/nfc-settings`

## Routes

Public/auth routes:
- `/onboarding`: login/register/local profile bootstrap
- `/auth/callback`: Supabase OAuth/email callback

Core app routes:
- `/home`: dashboard, daily rhythm summary, NFC quick action, routine cards, activity cards
- `/mock-scan`: mock/real NFC scan entry point
- `/cards`: user's NFC cards
- `/cards/register`: register/edit NFC card assignment
- `/cards/success`: card registration/scan success
- `/history`: activity log history
- `/manual-log`: manual activity logging
- `/activity-library`: activity library
- `/wellness`: wellness summary/manual shortcuts
- `/profile`: profile/settings screen
- `/workspaces`: currently opens the same profile/workspace settings screen
- `/sync`: sync queue/status
- `/nfc-settings`: NFC adapter/dev tools
- `/challenges`: challenge foundation screen

Routine routes:
- `/routines`: planned rhythms list
- `/routine-create`: create planned rhythm from activity library
- `/routine-daily?routineId=...`: daily routine execution/log entry
- `/routine-plan?routineId=...`: edit routine plan/progression/card binding
- `/routine-progress?routineId=...`: 4-week progress and roadmap
- `/routine-week?routineId=...&weekIndex=...`: selected week detail

Deep link route:
- `/t/[tagCode]`: NFC deep link resolution

## Main Flows

Onboarding flow:
1. `/`
2. `/onboarding`
3. Create profile + tenant
4. Seed activity library
5. Seed demo cards in local mode
6. `/home`

Mock NFC flow:
1. `/home` or bottom nav `Tara`
2. `/mock-scan`
3. Known tenant card:
   - Resolve active tenant + uid hash
   - Resolve assignment + activity type
   - Create activity log
   - Apply log to linked routine daily log when activity matches a planned routine
   - Return to `/home` with celebration params
4. Unknown card:
   - `/cards/register?mockUid=...&uidHash=...`
   - Select activity from library
   - Configure increment/goal
   - `/cards/success`

Planned rhythm flow:
1. `/routines`
2. `/routine-create`
3. Select existing activity library item
4. Configure plan
5. `/routine-daily` or `/routine-plan`
6. Card binding from `/routine-plan` goes to `/mock-scan?activityTypeId=...&routineId=...`
7. Unknown card registration preselects that planned activity
8. NFC/manual logs for the same activity feed realized progress

Progress flow:
1. Open a routine card
2. Tap `Gelişim`
3. `/routine-progress?routineId=...`
4. Tap a week row
5. `/routine-week?routineId=...&weekIndex=...`

Cards flow:
1. Drawer `Kartlarım`
2. `/cards`
3. Add/edit card
4. `/cards/register`
5. `/cards/success`

## Current Findings

- `expo start --web` fails in this sandbox with `ERR_SOCKET_BAD_PORT`; the app is running through `expo export --platform web` plus a local SPA fallback server.
- Static preview server is suitable for UI route inspection, but it is not hot-reload development mode.
- Navigation target scan found no missing app route for current `navigate('...')` calls.
- `/profile` and `/workspaces` currently render the same workspace/profile settings feature. This is functional, but the naming is confusing and should be split later if workspace management becomes separate from user profile.
- Bottom nav is correctly reduced to `Bugün`, `Tara`, `Profil`; Planlar and Gelişim are reachable from dashboard cards/drawer actions.
