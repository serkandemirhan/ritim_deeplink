# Ritim Console Tasks TODO

Bu dosya `console.md` spesifikasyonuna gore console islerini uygulanabilir siraya koyar. Amac sadece UI cikarmak degil; role-based access, Supabase veri modeli, RLS, audit ve gercek veri akisini parca parca tamamlamak.

## 0. Mevcut Durum Kontrolu

- [x] Mevcut console route yapisini envantere al: `/console`, `/console/platform`, `/console/sports-center`, `/sports-center-console`.
- [x] Mevcut `ConsoleShell`, mock data ve live Supabase data kullanimini ayir.
- [x] README ortam kurallarini dogrula: development/staging `ritim-dev`, production `ritim-prod`.
- [x] Console icin gerekli env degiskenlerini `.env.example` ile karsilastir.
- [x] Mevcut Basic Auth middleware davranisini dogrula ve production disinda gelistirme akisini bozmadigini test et.

### 0. Kontrol Notlari

Route envanteri:

- `/console`: her zaman `/console/platform` adresine redirect ediyor. Henuz role-based redirect yok.
- `/console/platform`: platform dashboard. Buyuk oranda `mockConsoleData.ts` kullaniyor; kullanici listesi icin `getPlatformUsers()` mock dosyasindaki env-aware helper ile fallback yapiyor.
- `/console/sports-center`: sports center dashboard. Sabit `sc-lyon-fit` merkezi ve mock data ile calisiyor.
- `/sports-center-console`: `/console/sports-center` alias redirect.
- `/console/platform/users`: `liveConsoleData.ts` ile Supabase Auth + `profiles` + `tenant_members` + `tenants` okuyor.
- `/console/platform/members`: `liveConsoleData.ts` sonucundan `member` role filtreliyor.
- `/console/platform/staff`: `liveConsoleData.ts` sonucundan owner/admin/coach filtreliyor.

Component/veri ayrimi:

- `ConsoleShell.tsx` layout, sidebar, metric card, section, data table, badge, usage bar ve action row componentlerini tek dosyada tutuyor.
- Sidebar role-based degil; platform ve sports-center linkleri herkes icin gorunuyor, diger pek cok menu itemi statik `span`.
- `mockConsoleData.ts` hem tipleri hem mock datasetleri hem de eski `getPlatformUsers()` Supabase fallback helperini iceriyor.
- `liveConsoleData.ts` sadece kullanici/staff/member tarafinda daha temiz live Supabase okuma sagliyor.
- Platform dashboard, sports-center dashboard, NFC cards, join requests, activity logs ve subscription kartlari henuz mock datasetlere bagli.

Environment kontrolu:

- README strategy: development `dev.getritim.com` + `ritim-dev`, staging `staging.getritim.com` + su an yine `ritim-dev`, production `getritim.com` + `ritim-prod`.
- `.env.example` bu stratejiyle uyumlu environment-specific aliaslari iceriyor: `NEXT_PUBLIC_SUPABASE_URL_DEV/STAGING/PROD`, `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV/STAGING/PROD`, `SUPABASE_SERVICE_ROLE_KEY_DEV/STAGING/PROD`.
- README genel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` degiskenlerini de "required" diye listeliyor; `.env.example` aktif ornek olarak aliaslari tercih ediyor. Bu dokuman dili sonra netlestirilmeli: generic fallback mi zorunlu, alias mi preferred?
- `.env.example` console Basic Auth icin `CONSOLE_BASIC_AUTH_USER` ve `CONSOLE_BASIC_AUTH_PASSWORD` iceriyor.

Middleware kontrolu:

- `middleware.ts` sadece `/console/:path*` ve `/sports-center-console/:path*` matcherlarini koruyor.
- `environmentFromHost()` production dondurmedigi surece middleware `NextResponse.next()` ile geciyor; localhost, dev host, staging host ve vercel preview development/staging akisini bloklamiyor.
- Production console Basic Auth env eksikse 401 donuyor.
- Production console Basic Auth env varsa `Authorization: Basic ...` kontrol ediliyor.
- Bu sadece Basic Auth katmani; app-level role guard henuz yok.

## 1. Domain Model ve Tipler

- [x] Console domain tiplerini olustur: `Organization`, `OrganizationAdmin`, `OrganizationMember`, `JoinRequest`, `NfcCard`, `Rhythm`, `ActivityLibraryItem`, `ActivityLog`, `SubscriptionPlan`, `OrganizationSubscription`, `AuditLog`, `SystemSettings`, `OrganizationSettings`.
- [x] Role tiplerini netlestir: `super_admin`, `platform_admin`, `support`, `wellness_admin`, `staff`, `member`.
- [x] Status enumlarini standardize et: active, inactive, suspended, pending, approved, rejected, lost, archived.
- [x] `organization_id` tenant ayirimini gerektiren her modelde zorunlu/nullable olarak tanimla.
- [x] Personal card ve organization-owned card ayrimini tip seviyesinde belirt.

### 1. Kontrol Notlari

- Console domain tipleri `app/console/_types/domain.ts` dosyasina eklendi.
- Platform rolleri: `super_admin`, `platform_admin`, `support`.
- Organization rolleri: `wellness_admin`, `staff`, `trainer`, `member`.
- Tenant-scoped modellerde camelCase `organizationId` kullanildi; Supabase mapping katmaninda `organization_id` kolonuna cevrilecek.
- `NfcCard`, `PersonalNfcCard | OrganizationNfcCard` union olarak tanimlandi. Personal kartlarda `ownerUserId` zorunlu, organization kartlarda `organizationId` zorunlu.
- `npx tsc --noEmit` basarili.

## 2. Supabase Sema ve RLS Hazirligi

- [x] Eksik tablolar icin migration dosyalarini planla: `organizations`, `organization_members`, `organization_admins`, `join_requests`, `nfc_cards`, `rhythms`, `rhythm_templates`, `activity_library`, `activity_logs`, `subscription_plans`, `organization_subscriptions`, `audit_logs`, `system_settings`, `organization_settings`.
- [x] Var olan `profiles`, `tenants`, `tenant_members`, `activity_types`, `tenant_nfc_cards` tablolarinin console spesifikasyonu ile eslesmesini analiz et.
- [x] Eski `tenant` isimlendirmesi ile yeni `organization` kavrami icin karar ver: rename migration mi, compatibility mapping mi?
- [x] Her tabloda `id`, `created_at`, `updated_at`, gerekli yerlerde `created_by`, `organization_id`, `status` alanlarini garanti et.
- [x] RLS policy taslagi hazirla: Super Admin tum rows, Wellness Admin sadece kendi organization rows.
- [x] Service role sadece server-side console query katmaninda kullanilsin.

### 2. Kontrol Notlari

- Schema/RLS plan dosyasi eklendi: `app/console/_docs/schema-rls-plan.md`.
- Karar: su an fiziksel tablo isimleri `tenants`, `tenant_members`, `tenant_nfc_cards` olarak korunacak. Console domain dili `Organization`, data access mapping dili `tenant_id` <-> `organizationId` olacak.
- Rename migration simdilik yapilmiyor; mobile sync zaten mevcut tenant tablolariyla calisiyor.
- Eksik console tablolari additive migration olarak planlandi: `join_requests`, `subscription_plans`, `organization_subscriptions`, `audit_logs`, `system_settings`, `organization_settings`.
- `organization_members` ve `organization_admins` icin yeni tablo yerine `tenant_members` role/status/genisletme kullanilacak.
- `activity_library` icin mevcut `activity_types` kullanilacak; global library icin nullable `tenant_id` riskli oldugundan migration sirasinda ya global tablo ya da tenant-copy stratejisi secilecek.
- RLS helper taslagi: `current_platform_role`, `is_super_admin`, `is_platform_admin`, `is_tenant_admin`.
- Service role sadece server-only console data/mutation katmaninda kullanilacak; permission guard ve audit log zorunlu kalacak.

## 3. Auth ve Permission Katmani

- [x] Console auth helper olustur: aktif kullanici, platform role, organization admin role.
- [x] Server-side permission guard olustur: `requireSuperAdmin`, `requireWellnessAdmin`, `requireOrganizationAccess`.
- [x] Route-level guard uygula: yetkisiz route server tarafinda engellensin.
- [x] Sidebar menu itemlarini role-based hale getir.
- [x] Wellness Admin icin ilk versiyonda tek organization varsayimini kodda netlestir.
- [x] Permission denied icin ortak error/empty state olustur.

### 3. Kontrol Notlari

- Server-only permission helper eklendi: `app/console/_auth/permissions.ts`.
- `getConsoleSession()` simdilik production Basic Auth / development fallback uzerinden role uretiyor. Gercek Supabase session entegrasyonu sonraki data/auth adiminda bu fonksiyonun icine alinacak.
- Development test override:
  - `CONSOLE_DEV_ROLE=wellness_admin`
  - `CONSOLE_DEV_ORGANIZATION_ID=sc-lyon-fit`
  - Non-production requestlerde `x-ritim-console-role` header override destekleniyor.
- Guard fonksiyonlari eklendi:
  - `requireSuperAdmin()`
  - `requireWellnessAdmin()`
  - `requireOrganizationAccess(organizationId)`
- `/console` artik role gore redirect ediyor: platform rolleri `/console/platform`, organization rolleri `/console/sports-center`.
- Platform route'lari server-side guard kullaniyor: `/console/platform`, `/console/platform/users`, `/console/platform/members`, `/console/platform/staff`.
- Sports-center route'u `requireOrganizationAccess(center.id)` kullaniyor. Ilk versiyon tek organization varsayimi `CONSOLE_DEV_ORGANIZATION_ID` ile temsil ediliyor.
- `ConsoleShell` role-aware sidebar filtreleme yapiyor; Wellness Admin platform menu itemlarini gormuyor.
- Ortak permission state eklendi: `PermissionDeniedState`.

## 4. Reusable Console Components

- [x] `AdminLayout` veya mevcut `ConsoleShell` kapsamlarini netlestir.
- [x] `Sidebar` componentini role-based navigation ile yenile.
- [x] `PageHeader` componenti ekle.
- [x] `DataTable` componentini search/filter/sort/pagination destekli hale getir.
- [x] `StatusBadge` componentini ortak status/tone map ile standardize et.
- [x] `SearchBar` ve `FilterBar` componentleri ekle.
- [x] `ConfirmDialog` ekle.
- [x] `FormField` ekle.
- [x] `StatCard` ve `ChartCard` componentlerini ortaklastir.
- [x] `EmptyState`, `LoadingState`, `ErrorState` componentlerini ortaklastir.
- [x] Toast/feedback altyapisini ekle veya mevcut yaklasimi belirle.

### 4. Kontrol Notlari

- Mevcut `ConsoleShell` admin layout kapsayicisi olarak korunuyor; yeni sayfalar icin ayri `AdminLayout` dosyasi acilmadi.
- `Sidebar` ayri export edilen component haline getirildi ve role-based nav filtresini kullaniyor.
- `PageHeader`, `StatCard`, `ChartCard`, `StatusBadge`, `SearchBar`, `FilterBar`, `FilterSelect`, `ConfirmDialog`, `FormField`, `TextInput`, `SelectInput`, `EmptyState`, `LoadingState`, `ErrorState`, `PermissionDeniedState`, `ToastMessage` eklendi.
- Eski sayfalari kirmamak icin `MetricCard = StatCard` ve `Badge = StatusBadge` aliaslari korundu.
- `DataTable` caption, empty state ve pagination metadata destekli hale getirildi.
- Yeni componentler icin gerekli stiller `app/globals.css` icine eklendi.
- `npx tsc --noEmit` basarili.

## 5. Data Access Katmani

- [x] Mock data ve live data ayrimini temizle: live query fonksiyonlari tek klasorde toplansin.
- [x] Organization list/detail queryleri yaz.
- [x] Wellness Admin/staff queryleri yaz.
- [x] Member list/detail queryleri yaz.
- [x] Join request query ve mutationlari yaz.
- [x] NFC card list/detail/create/update/assign query ve mutationlari yaz.
- [x] Rhythm/template list/detail/create/update/assign query ve mutationlari yaz.
- [x] Activity library query ve mutationlari yaz.
- [x] Activity log ve progress queryleri yaz.
- [x] Subscription plan ve organization subscription queryleri yaz.
- [x] Audit log write helper ekle.
- [x] Her mutation icin audit log olustur.

### 5. Kontrol Notlari

- Server-only Supabase access helper eklendi: `app/console/_data/supabaseServer.ts`.
- Console repository eklendi: `app/console/_data/consoleRepository.ts`.
- Repository queryleri: organizations, users, members, staff, join requests, NFC cards, rhythms, activity library, activity logs, subscription plans, organization subscriptions, audit logs.
- Repository mutation helperlari: join request create/review, NFC card create/update/assign, rhythm create/update, activity library item create, audit log write.
- `mockConsoleData.ts` artik live kullanici okumasini repository uzerinden dener; Supabase env veya tablo eksikse mock fallback korunur.
- `liveConsoleData.ts` duplicate Supabase REST/Auth kodu tasimiyor; compatibility wrapper olarak `listConsoleUsers()` kullaniyor.
- Not: Eksik console tablolari migration uygulanana kadar repository ilgili listelerde bos sonuc + error dondurebilir. Task 6 live dashboard baglarken bu error/empty state okunmali.
- Repository mutationlari basarili write sonrasi `writeAuditLog()` cagiriyor. Sonraki UI form/action katmanlari bu helperlari kullanmali; dogrudan Supabase write yapilmamali.
- `npx tsc --noEmit` basarili.

## 6. Phase 1 - Core Admin Foundation

- [x] `/console` girisini role gore yonlendir: Super Admin -> `/console/platform`, Wellness Admin -> `/console/sports-center`.
- [x] Super Admin dashboard KPI kartlarini live data ile bagla.
- [x] Wellness Admin dashboard KPI kartlarini organization-scoped live data ile bagla.
- [x] Organizations page olustur: liste, search, status/plan filter, pagination.
- [x] Organization create/edit formu olustur.
- [x] Organization detail page olustur: basic info, subscription, admins, members, cards, rhythms, usage, audit.
- [x] Members page olustur: role scope'a gore global veya organization-scoped.
- [x] NFC Cards page olustur: role scope'a gore global veya organization-scoped.
- [x] Basic permission testleri ekle.

### 6. Kontrol Notlari

- `/console` role-based redirect daha once eklenen permission katmani uzerinden calisiyor.
- Dashboard live snapshot helper eklendi: `app/console/_data/consoleDashboardData.ts`.
- Platform dashboard KPI kartlari repository verisini okuyor; Supabase env/tablo eksikse mock fallback ve hata mesaji gosteriyor.
- Sports-center dashboard KPI kartlari organization-scoped repository verisini okuyor; fallback davranisi platform ile ayni.
- Sidebar `Organizations` item'i `/console/platform/organizations` route'una baglandi.
- Organizations liste sayfasi eklendi: search, status filter, plan filter, server-side pagination, usage bars.
- Organization create/edit formlari eklendi: `/console/platform/organizations/new`, `/console/platform/organizations/[organizationId]/edit`.
- Organization detail sayfasi eklendi: `/console/platform/organizations/[organizationId]`.
- Detail sayfasi basic info, subscription/usage, admins/staff, members, cards, rhythms/library, activity logs ve audit bolumlerini gosteriyor.
- Sports-center scoped members sayfasi eklendi: `/console/sports-center/members`.
- Sports-center scoped NFC cards sayfasi eklendi: `/console/sports-center/nfc-cards`.
- Permission rules server-only dosyadan ayrildi: `app/console/_auth/permissionRules.ts`.
- Basic permission matrix static TypeScript fixture olarak eklendi: `app/console/_auth/permissionRules.static-test.ts`. Projede runtime test runner olmadigi icin su an `tsc` kapsaminda derleniyor.
- `npx tsc --noEmit` basarili.

## 7. Phase 2 - Operational Management

- [x] Join Requests page olustur.
- [x] Join request approve/reject mutationlarini yaz.
- [x] Approve sonrasi organization member kaydi olustur.
- [x] Reject sonrasi kullanicinin personal user olarak kalmasini garanti et.
- [x] Rhythm templates page olustur.
- [x] Rhythm template create/edit/archive formlari ekle.
- [x] Member rhythm assignment akisini ekle.
- [x] NFC card assignment akisini ekle: member, rhythm, default amount, unit.
- [x] Card scan history sayfasini organization scope ile ekle.
- [x] Member progress page/detail ekle.
- [x] Organization settings page ekle.
- [x] Subscription limit kontrolunu member/card creation oncesi uygula.

### 7. Kontrol Notlari

- Join request queue eklendi: `/console/sports-center/join-requests`.
- Approve/reject server actionlari `reviewJoinRequest()` uzerinden calisiyor.
- Approve akisi once organization member limitini kontrol ediyor, sonra `tenant_members` icinde active member kaydi olusturuyor.
- Reject akisi sadece join request status'unu `rejected` yapiyor; personal user veya tenant member kaydi olusturmuyor.
- Rhythm templates sayfasi eklendi: `/console/sports-center/rhythms`.
- Rhythm template create/edit/archive akislari eklendi: `/console/sports-center/rhythms/[rhythmId]/edit`.
- Member rhythm assignment ekrani eklendi: `/console/sports-center/assignments`.
- Member rhythm assignment su an dedicated assignment tablosu olmadigi icin audit-backed operational intent olarak kaydediliyor.
- NFC card assignment ayni ekranda gercek `card_assignments` insert'i kullaniyor.
- Card scan/activity history sayfasi eklendi: `/console/sports-center/activity-logs`.
- Member progress detail route'u eklendi: `/console/sports-center/members/[memberId]`.
- Organization settings sayfasi eklendi: `/console/sports-center/settings`.
- Settings save su an `organization_settings` migration'i olmadigi icin audit-backed operational intent olarak kaydediliyor.
- Subscription/plan limit kontrolu member approval ve NFC card creation oncesinde repository seviyesinde yapiliyor.
- `npx tsc --noEmit` basarili.

## 8. Phase 3 - Business Management

- [x] Subscription plans page olustur.
- [x] Super Admin icin plan create/edit/activate/deactivate ekle.
- [x] Organization subscription assignment/override akisini ekle.
- [x] Wellness Admin icin read-only subscription usage page ekle.
- [x] Reports pages ekle: platform reports ve organization reports.
- [x] CSV export ekle: members, NFC cards, activity logs, reports.
- [x] Audit logs page ekle: Super Admin all, Wellness Admin own organization.
- [x] System settings page ekle.
- [x] Organization settings mutationlari icin audit log ekle.

### 8. Kontrol Notlari

- Platform subscription management sayfasi eklendi: `/console/platform/subscriptions`.
- Subscription plan create ve activate/deactivate/archive actionlari repository uzerinden audit log yazarak calisiyor.
- Organization subscription assignment/override akisi `organization_subscriptions` insert'i kullaniyor.
- Wellness Admin read-only subscription usage sayfasi eklendi: `/console/sports-center/subscription`.
- Platform reports sayfasi eklendi: `/console/platform/reports`.
- Organization reports sayfasi eklendi: `/console/sports-center/reports`.
- CSV export route'lari eklendi:
  - `/console/platform/reports/export/[dataset]`
  - `/console/sports-center/reports/export/[dataset]`
- Export datasetleri: members, nfc-cards, activity-logs; platform ayrica organizations export eder.
- Platform audit logs sayfasi eklendi: `/console/platform/audit-logs`.
- System settings sayfasi eklendi: `/console/platform/settings`.
- System settings migration dosyasi eklendi: `apps/mobile-rn/supabase/console_settings.sql`.
- System settings artik `system_settings` tablosundan `id=global` satirini okuyor ve save sirasinda insert/update yapiyor.
- Organization settings mutationlari Task 7'de `/console/sports-center/settings` icinde audit-backed operational intent olarak eklendi.
- System settings save islemi basarili write sonrasi audit log yazar.
- `npx tsc --noEmit` basarili.

## 9. Phase 4 - Advanced

- [ ] Impersonation/support mode tasarimini yaz ve risklerini netlestir.
- [ ] Read-only organization support view ekle.
- [ ] Advanced charts ekle: scans over time, active users, subscription distribution, completion rates.
- [ ] Bulk NFC card import akisini ekle.
- [ ] Feature flags modelini ve settings UI'ini ekle.
- [ ] Billing/payment entegrasyonu icin placeholder yerine gercek provider karari al.

## 10. QA ve Kabul Kriterleri

- [ ] Super Admin baska tum organization verilerini gorebiliyor mu?
- [ ] Wellness Admin baska organization verisini route, query ve RLS seviyesinde goremiyor mu?
- [ ] Unauthorized route'lar server-side bloklaniyor mu?
- [ ] Tum list pages search/filter/sort/pagination destekli mi?
- [ ] Tum destructive actions confirm dialog kullaniyor mu?
- [ ] Tum create/update/delete/assign islemleri audit log uretiyor mu?
- [ ] NFC card scan activity log uretiyor mu?
- [ ] Organization card scaninde kullanici approved member degilse activity count edilmeyip join request akisi tetikleniyor mu?
- [ ] Production console Basic Auth ve app-level role guard birlikte calisiyor mu?
- [ ] `npm run build` basarili mi?

## Ilk Uygulama Sirasi

1. Mevcut console route ve component envanteri.
2. Domain type dosyalari.
3. Permission/auth helper katmani.
4. Role-based navigation ve route redirect.
5. Data access katmanini mock/live ayrimi ile temizleme.
6. Super Admin dashboard live data.
7. Wellness Admin dashboard live data.
8. Organizations list/detail/create/edit.
9. Members list/detail.
10. NFC Cards list/detail/assign.
