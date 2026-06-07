You are working on the Ritim app inside the ritim_platform monorepo.

Read AGENTS.md first and follow its instructions.

Context:
Ritim is a mobile-first fitness and wellness habit tracking app. Users register NFC stickers/cards, assign them to fitness or wellness actions, and later scan/tap them to log activities. The app must be multi-tenant by design and offline-first by behavior.

Current technical direction:
- Use React Native + Expo.
- Use TypeScript.
- Use Expo Router.
- Use Expo Web for preview.
- Use Zustand or React Context for local state.
- Do not add real NFC yet.
- Do not add Supabase yet.
- Do not add SQLite/WatermelonDB yet.
- Do not add native-only dependencies yet.
- Implement mock NFC only.

Important product update:
Users must NOT manually type exercise or wellness activity names when assigning a card. They must select from a predefined Activity Library. For example, they should select “Push-ups / Şınav” from the library instead of typing “pushup” manually.

The selected library item determines:
- category
- display name
- unit
- default increment
- icon
- color
- optional calories per unit

Custom activities can be added later, but Phase 1 should prioritize selecting from the predefined library.

Main Phase 1 goal:
Build the complete mock/offline UI and state flow:

Onboarding
→ Workspace creation
→ Activity Library seed
→ Mock NFC scan
→ Register card
→ Select activity from library
→ Configure increment and daily goal
→ Save card
→ Scan same mock card again
→ Create activity log
→ Show Home summary, My Cards, and History

Core product promise:
“Dokun. Kaydet. Geliş.”

Brand:
Ritim

Design direction:
Dark premium fitness/wellness interface.
Use:
- deep navy / black background
- rounded cards
- neon green primary accent
- blue secondary accent
- purple wellness accent
- clean spacing
- readable typography
- modern mobile-first UI

Suggested colors:
background: "#07111F"
surface: "#101B2D"
surfaceLight: "#17243A"
primary: "#35E27A"
secondary: "#37B7FF"
purple: "#9B5CFF"
textPrimary: "#F4F7FB"
textSecondary: "#9BA8BC"
border: "#26364F"

Phase 1 scope:
Implement the app foundation with mock local state. It should run in Expo Web.

Do not implement:
- real NFC
- Supabase
- auth
- payments
- push notifications
- Apple Health / Google Fit
- web admin
- challenges
- leaderboards
- advanced analytics
- native-only modules

Required routes with Expo Router:
- /
- /onboarding
- /home
- /mock-scan
- /cards
- /cards/register
- /history

Start logic:
If no profile exists, route to /onboarding.
If profile exists, route to /home.

Required folder structure:
- app/
- src/components/
- src/theme/
- src/store/
- src/types/
- src/features/onboarding/
- src/features/home/
- src/features/workspaces/
- src/features/cards/
- src/features/activity-library/
- src/features/history/
- src/features/nfc/

Reusable components to create:
- AppScreen
- AppButton
- AppTextInput
- AppCard
- AppBadge
- SectionHeader
- StatCard
- EmptyState

Data model requirements:

Create TypeScript types for:

1. UserProfile
Fields:
- id: string
- fullName: string
- email?: string
- createdAt: string
- updatedAt: string

2. Tenant
Fields:
- id: string
- name: string
- slug: string
- type: "personal" | "gym" | "wellness_studio" | "trainer" | "company"
- role: "tenant_owner" | "tenant_admin" | "trainer" | "member"
- createdAt: string
- updatedAt: string

3. ActivityType
Fields:
- id: string
- tenantId: string
- category: "fitness" | "wellness" | "routine"
- name: string
- displayNameTr: string
- displayNameEn: string
- unit: string
- defaultIncrement: number
- icon?: string
- color?: string
- caloriesPerUnit?: number | null
- isActive: boolean
- isCustom?: boolean
- createdAt: string
- updatedAt: string

4. NfcTag
This represents the physical/global NFC tag.
Fields:
- id: string
- uidHash: string
- mockUid?: string
- publicTagCode?: string
- status: "active" | "disabled"
- firstSeenAt: string
- lastSeenAt: string

5. TenantNfcCard
This represents what a physical NFC tag means inside one tenant/workspace.
Fields:
- id: string
- tenantId: string
- tagId: string
- uidHash: string
- cardName: string
- category: "fitness" | "wellness" | "routine"
- status: "active" | "unassigned" | "disabled"
- createdAt: string
- updatedAt: string

6. CardAssignment
Fields:
- id: string
- tenantId: string
- tenantCardId: string
- activityTypeId: string
- incrementValue: number
- unit: string
- dailyGoal?: number | null
- isActive: boolean
- createdAt: string
- updatedAt: string

7. ActivityLog
Fields:
- id: string
- tenantId: string
- userId: string
- tagId?: string
- tenantCardId?: string
- activityTypeId: string
- category: "fitness" | "wellness" | "routine"
- value: number
- unit: string
- calories?: number | null
- source: "mock_nfc" | "nfc" | "manual"
- syncStatus: "local_only" | "pending" | "synced" | "failed"
- loggedAt: string
- createdAt: string

Important multi-tenant rule:
A physical NFC tag is global, but its meaning depends on the active tenant.

Example:
Physical tag UID: MOCK-TAG-001

Tenant A:
- Push-ups / +10 reps

Tenant B:
- Water / +500 ml

So the same physical NFC tag can belong to multiple tenants with different assignments. The active tenant determines what action the card performs.

All business logic must resolve cards using:
activeTenantId + uidHash

Required local store:
Use Zustand unless there is a strong reason not to.

Store state:
- profile
- tenants
- activeTenantId
- activityTypes
- nfcTags
- tenantNfcCards
- cardAssignments
- activityLogs

Required store actions:
- createProfile
- createTenant
- setActiveTenant
- seedDefaultActivityTypes
- getActivityTypesByCategory
- createMockNfcTag
- createTenantNfcCard
- createCardAssignment
- logActivityFromMockScan
- getActiveTenant
- getCardsForActiveTenant
- getLogsForActiveTenant
- getTodayStats
- getAssignmentForTenantCard
- getActivityTypeById

Activity Library requirements:

When a tenant is created, seed a default Activity Library for that tenant.

Fitness library:
1. Push-ups / Şınav
   - unit: reps
   - defaultIncrement: 10
   - icon: push_up
   - color: "#35E27A"
   - caloriesPerUnit: 0.32

2. Squats / Squat
   - unit: reps
   - defaultIncrement: 20
   - icon: squat
   - color: "#35E27A"
   - caloriesPerUnit: 0.32

3. Plank
   - unit: min
   - defaultIncrement: 1
   - icon: plank
   - color: "#37B7FF"
   - caloriesPerUnit: 4.1

4. Running / Koşu
   - unit: min
   - defaultIncrement: 10
   - icon: running
   - color: "#37B7FF"
   - caloriesPerUnit: 8.0

5. Walking / Yürüyüş
   - unit: min
   - defaultIncrement: 10
   - icon: walking
   - color: "#37B7FF"
   - caloriesPerUnit: 4.0

6. Jump Rope / İp Atlama
   - unit: min
   - defaultIncrement: 5
   - icon: jump_rope
   - color: "#35E27A"
   - caloriesPerUnit: 10.0

7. Lunges
   - unit: reps
   - defaultIncrement: 10
   - icon: lunges
   - color: "#35E27A"
   - caloriesPerUnit: 0.30

8. Sit-ups
   - unit: reps
   - defaultIncrement: 10
   - icon: sit_up
   - color: "#35E27A"
   - caloriesPerUnit: 0.25

9. Burpees
   - unit: reps
   - defaultIncrement: 10
   - icon: burpee
   - color: "#9B5CFF"
   - caloriesPerUnit: 0.50

10. Pull-ups
   - unit: reps
   - defaultIncrement: 5
   - icon: pull_up
   - color: "#35E27A"
   - caloriesPerUnit: 0.50

11. Cycling / Bisiklet
   - unit: min
   - defaultIncrement: 10
   - icon: cycling
   - color: "#37B7FF"
   - caloriesPerUnit: 7.0

12. Stretching / Esneme
   - unit: min
   - defaultIncrement: 10
   - icon: stretching
   - color: "#9B5CFF"
   - caloriesPerUnit: 2.0

13. Yoga
   - unit: min
   - defaultIncrement: 15
   - icon: yoga
   - color: "#9B5CFF"
   - caloriesPerUnit: 3.0

Wellness library:
1. Water / Su
   - unit: ml
   - defaultIncrement: 500
   - icon: water
   - color: "#37B7FF"
   - caloriesPerUnit: null

2. Coffee / Kahve
   - unit: cup
   - defaultIncrement: 1
   - icon: coffee
   - color: "#A56B42"
   - caloriesPerUnit: null

3. Meditation / Meditasyon
   - unit: min
   - defaultIncrement: 10
   - icon: meditation
   - color: "#9B5CFF"
   - caloriesPerUnit: null

4. Vitamins / Vitamin
   - unit: tablet
   - defaultIncrement: 1
   - icon: vitamins
   - color: "#9B5CFF"
   - caloriesPerUnit: null

5. Breathing / Nefes Egzersizi
   - unit: min
   - defaultIncrement: 5
   - icon: breathing
   - color: "#37B7FF"
   - caloriesPerUnit: null

6. Walk Break / Yürüyüş Molası
   - unit: min
   - defaultIncrement: 10
   - icon: walk_break
   - color: "#35E27A"
   - caloriesPerUnit: null

7. Sleep / Uyku
   - unit: hour
   - defaultIncrement: 1
   - icon: sleep
   - color: "#9B5CFF"
   - caloriesPerUnit: null

8. Stretch Break / Esneme Molası
   - unit: min
   - defaultIncrement: 5
   - icon: stretch_break
   - color: "#9B5CFF"
   - caloriesPerUnit: null

9. Healthy Meal / Sağlıklı Öğün
   - unit: meal
   - defaultIncrement: 1
   - icon: healthy_meal
   - color: "#35E27A"
   - caloriesPerUnit: null

Onboarding screen requirements:
Fields:
- full name
- optional email
- workspace name
- workspace type:
  - Personal
  - Gym
  - Wellness Studio
  - Trainer
  - Company

On submit:
- create local profile
- create local tenant
- set tenant as active
- seed default activity library for that tenant
- navigate to /home

Home screen requirements:
Show:
- greeting
- active workspace name
- today stats:
  - workouts count
  - wellness actions count
  - water total
  - total logs today
- recent activity list
- CTA button: Mock NFC Scan
- CTA button: My Cards
- CTA button: History

Mock NFC scan requirements:
Create a mock NFC scan screen.

Use mock UID examples:
- MOCK-TAG-001
- MOCK-TAG-002
- MOCK-TAG-003

The screen should let the user choose or generate a mock UID.

Behavior:
1. Convert mock UID to uidHash.
   Example deterministic hash:
   uidHash = `mock-hash-${mockUid}`

2. Check whether active tenant already has a TenantNfcCard for that uidHash.

3. If found and assigned:
   - resolve CardAssignment
   - resolve ActivityType
   - create ActivityLog
   - show success message:
     Example:
     “+10 Şınav kaydedildi”
     “+500 ml Su kaydedildi”

4. If not found:
   - show:
     “Bu kart bu workspace içinde tanımlı değil.”
   - show button:
     “Bu kartı tanımla”
   - navigate to card register flow with mockUid and uidHash

Register card flow requirements:
Can be one screen or a simple multi-step flow.

Required steps:
1. New Card Detected
   - show mock UID
   - show active workspace

2. Card Info
   - card name input
   - examples:
     - Push-up Tag
     - Water Bottle
     - Meditation Corner

3. Category Selection
   - Fitness
   - Wellness

4. Activity Library Selection
   - If Fitness selected, show fitness library items.
   - If Wellness selected, show wellness library items.
   - User must select one item.
   - User should not type activity name manually.
   - Each item should show:
     - icon
     - Turkish display name
     - English name optionally
     - default increment and unit

Example list item:
“Şınav”
“Varsayılan: +10 reps”

Example list item:
“Su”
“Varsayılan: +500 ml”

5. Configure Details
   - increment value
   - unit, read from selected ActivityType
   - daily goal optional

6. Save
   On save:
   - create physical NfcTag if it does not already exist
   - create TenantNfcCard under active tenant
   - create CardAssignment
   - navigate to success or My Cards

Success message examples:
“Push-up Tag hazır!”
“Bu kart artık Şınav aktivitesine bağlı.”
“Her okutma +10 reps kaydeder.”

My Cards screen requirements:
Show cards for active tenant only.

Each card should show:
- card name
- category
- linked activity display name
- increment value + unit
- status
- mock UID or short tag code

Examples:
Push-up Tag
Fitness · Şınav
+10 reps per tap
Active

Water Bottle
Wellness · Su
+500 ml per tap
Active

History screen requirements:
Show activity logs for active tenant only.

Each row should show:
- activity display name
- value + unit
- source: Mock NFC
- sync status: Local only
- logged time

Filters can be simple:
- All
- Fitness
- Wellness
- Today

Example row:
Şınav
+10 reps
Mock NFC · Local only
Today 10:42

Acceptance criteria:
- App runs in Expo Web.
- No native-only dependency is used.
- No Supabase dependency is used.
- User can complete onboarding.
- Workspace appears on Home.
- Default activity library is seeded.
- User can open Mock NFC Scan.
- Unknown mock NFC tag can be registered.
- User selects an activity from the library, not manual typing.
- User can configure increment and daily goal.
- Registered card appears in My Cards.
- Scanning registered mock tag logs the assigned activity.
- Home summary updates after scan.
- History shows the activity log.
- Same physical mock tag can later be registered differently under another tenant because model separates NfcTag from TenantNfcCard.

Implementation order:
1. Create or update TypeScript models.
2. Create design tokens and reusable components.
3. Create Zustand store with required state and actions.
4. Implement onboarding.
5. Implement home.
6. Implement mock NFC scan.
7. Implement register card flow with activity library selection.
8. Implement My Cards.
9. Implement History.
10. Polish UI and ensure Expo Web works.

Please implement this cleanly with small files, typed functions, and reusable components. Avoid over-engineering, but keep the architecture ready for future SQLite, real NFC, and Supabase sync.

Phase 2------

Phase 2 — Kullanıcı Deneyimi, Sağlık Takibi ve Akıllı Egzersiz Altyapısı

Bu fazın amacı uygulamayı sadece “NFC ile egzersiz başlat/bitir” seviyesinden çıkarıp, kullanıcının günlük spor ve sağlık ritmini takip eden gerçek bir fitness asistanına dönüştürmek.

1. Gelişmiş Egzersiz Kütüphanesi

Kullanıcı egzersizleri manuel yazmak yerine kütüphaneden seçecek.

Özellikler:

Egzersiz kategorileri:
Chest
Back
Legs
Shoulder
Arms
Core
Cardio
Stretching
Örnek egzersizler:
Push-up
Squat
Bench Press
Running
Plank
Pull-up
Her egzersiz için:
Egzersiz adı
Kas grubu
Zorluk seviyesi
Ortalama kalori katsayısı
Süre / tekrar / set bilgisi
Opsiyonel görsel veya kısa açıklama
2. Kalori Hesaplama

Kullanıcının profiline göre yaklaşık kalori hesabı yapılır.

Gerekli kullanıcı bilgileri:

Yaş
Cinsiyet
Boy
Kilo
Aktivite seviyesi

Hesaplama mantığı:

Egzersiz tipi
Süre
Kullanıcı kilosu
Egzersiz yoğunluğu

Örnek:

86 kg bir kullanıcı 20 dakika orta yoğunlukta push-up antrenmanı yaptıysa, sistem yaklaşık yakılan kaloriyi hesaplar.

3. Günlük Sağlık Takibi

Spor dışındaki basit sağlık alışkanlıkları ayrı bir modül olarak eklenir.

Özellikler:

Günlük su takibi
Günlük kahve takibi
Uyku süresi
Günlük adım sayısı manuel giriş
Kilo takibi
Günlük not alanı

Önemli nokta:

Bunlar egzersiz modülünden ayrı tutulmalı. Yani sistemde iki ana alan olur:

Workout Tracking
Wellness Tracking
4. Kullanıcı Dashboard Geliştirmesi

Dashboard daha zengin hale gelir.

Gösterilecek bilgiler:

Bugünkü antrenmanlar
Tamamlanan egzersizler
Yakılan toplam kalori
Su içme durumu
Kahve sayısı
Haftalık aktivite özeti
En çok yapılan egzersizler
NFC ile doğrulanan aktiviteler
5. NFC Kart / Sticker Yönetimi

Kullanıcı kendi NFC sticker’ını sisteme ekleyebilir.

Özellikler:

NFC sticker okutma
Sticker’a isim verme
“Push-up Alanı”
“Koşu Bandı 1”
“Salon Giriş”
Sticker’ı egzersiz ile eşleştirme
Aktif / pasif yapma
Kayıp sticker’ı devre dışı bırakma
6. Antrenman Geçmişi

Kullanıcı geçmiş aktivitelerini görebilir.

Filtreler:

Tarihe göre
Egzersiz tipine göre
NFC doğrulamalı / doğrulamasız
Kaloriye göre
Süreye göre