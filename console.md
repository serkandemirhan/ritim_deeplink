# Ritim Console – Super Admin & Wellness Admin Specification

## 1. Goal

Build a complete web-based admin console for the Ritim application.

The console must allow:

* **Super Admin** to manage the full platform globally.
* **Wellness Admin** to manage only their own wellness center / gym / organization.
* Both roles must be able to manage users, NFC cards, rhythms, plans, subscriptions, reports, and organization-level settings according to their permissions.

The system must be secure, multi-tenant, responsive, and connected to the existing Supabase backend.

---

## 2. Roles

### 2.1 Super Admin

Super Admin has global access to the whole platform.

Super Admin can:

* View all organizations / wellness centers.
* Create, edit, activate, deactivate, and delete organizations.
* Create and manage Wellness Admin users.
* View all users across all organizations.
* View all NFC cards across the platform.
* View all rhythms / goals / activity logs.
* Manage subscription packages.
* Assign or change subscription packages for organizations.
* View platform-wide reports.
* Access audit logs.
* Manage global app settings.
* Manage activity library templates.
* Manage NFC card type templates.
* Support organizations by impersonating or viewing organization data in read-only/admin mode.

Super Admin must never be blocked by tenant-level restrictions.

---

### 2.2 Wellness Admin

Wellness Admin manages only their assigned wellness center / gym / organization.

Wellness Admin can:

* View and edit their own organization profile.
* Manage members of their own organization.
* Approve or reject member join requests.
* Create, edit, activate, deactivate, and delete members under their organization.
* Assign NFC cards to members.
* Manage organization-owned NFC cards.
* View card scan history for their organization.
* Create organization-level rhythm templates.
* Assign rhythm templates to members.
* View member progress.
* View reports and statistics only for their own organization.
* Manage staff users under their organization if allowed by subscription.
* Configure organization settings.
* View subscription usage limits but cannot change package unless payment flow is implemented.

Wellness Admin must not access data from other organizations.

---

## 3. Tenant / Organization Concept

The console must support multi-tenant structure.

Each organization represents one wellness center, gym, company, club, or institution.

Each organization has:

* Organization name
* Slug
* Logo
* Contact email
* Phone number
* Address
* Country
* City
* Timezone
* Status: active / inactive / suspended
* Subscription plan
* Member limit
* NFC card limit
* Created date
* Updated date

All organization-related data must include `organization_id`.

---

## 4. Main Navigation

Console sidebar should include:

### Super Admin Menu

1. Dashboard
2. Organizations
3. Wellness Admins
4. Users / Members
5. NFC Cards
6. Rhythms
7. Activity Library
8. Subscriptions
9. Payments / Billing
10. Reports
11. Audit Logs
12. System Settings

### Wellness Admin Menu

1. Dashboard
2. Members
3. Join Requests
4. NFC Cards
5. Rhythms / Templates
6. Member Progress
7. Reports
8. Organization Settings
9. Subscription Usage

Menu items must be role-based. Users must never see unauthorized menu items.

---

## 5. Dashboard

### 5.1 Super Admin Dashboard

Show platform-wide KPIs:

* Total organizations
* Active organizations
* Suspended organizations
* Total users
* Total Wellness Admins
* Total NFC cards
* Active NFC cards
* Total scans today
* Total rhythms created
* Total subscriptions by plan
* Monthly active users
* Recent organizations
* Recent scan activity
* Recent support/audit actions

Charts:

* New organizations over time
* Active users over time
* NFC scans over time
* Subscription distribution
* Top organizations by activity

---

### 5.2 Wellness Admin Dashboard

Show organization-level KPIs:

* Total members
* Active members
* Pending join requests
* Total NFC cards
* Assigned NFC cards
* Unassigned NFC cards
* Total scans today
* Weekly activity count
* Members with active rhythm
* Members without active rhythm
* Subscription usage: members used / limit
* Subscription usage: cards used / limit

Charts:

* Daily scan activity
* Weekly member progress
* Most active members
* Most used NFC cards
* Rhythm completion rate

---

## 6. Organization Management

Only Super Admin can access full organization management.

Features:

* List organizations
* Search by name, email, city, country, status
* Filter by subscription plan and status
* Create organization
* Edit organization
* Activate / deactivate organization
* Suspend organization
* Delete organization if no critical data exists, otherwise soft delete
* View organization detail page

Organization detail page must include:

* Basic info
* Subscription info
* Members
* Wellness Admins
* NFC cards
* Rhythms
* Scan activity
* Usage limits
* Audit history

---

## 7. Wellness Admin Management

Super Admin can:

* Create Wellness Admin
* Assign Wellness Admin to organization
* Edit Wellness Admin profile
* Activate / deactivate Wellness Admin
* Reset access if needed
* View last login
* View assigned organization

Wellness Admin fields:

* Full name
* Email
* Phone
* Organization
* Role
* Status
* Created date
* Last login date

A Wellness Admin must only access one or more assigned organizations depending on the data model. For the first version, assume one Wellness Admin belongs to one organization.

---

## 8. Member Management

### 8.1 Super Admin

Super Admin can view all members globally.

Features:

* List all members
* Search members
* Filter by organization, status, subscription, activity level
* View member detail
* Activate / deactivate member
* Move member to another organization if needed
* View member rhythms
* View member NFC cards
* View scan history

### 8.2 Wellness Admin

Wellness Admin can manage only members of their own organization.

Features:

* List members
* Search members
* Filter by active / inactive / pending
* Create member manually
* Edit member
* Deactivate member
* Delete member only if allowed, otherwise soft delete
* View member detail
* Assign NFC cards
* Assign rhythm templates
* View progress
* View scan history

Member detail page must include:

* Profile info
* Organization info
* Active rhythms
* Assigned NFC cards
* Activity history
* Weekly/monthly progress
* Join request source
* Status

---

## 9. Join Request Flow

Users can request to join a wellness center in two ways:

1. By scanning the organization QR code.
2. By scanning an NFC card that belongs to a wellness center.

When a user requests to join:

* A pending join request is created.
* Wellness Admin sees it in Join Requests.
* Wellness Admin can approve or reject.
* If approved, user becomes member of that organization.
* If rejected, user remains personal user and does not access gym features.

Join request fields:

* User ID
* Organization ID
* Request source: QR / NFC
* NFC card ID if applicable
* Status: pending / approved / rejected
* Requested date
* Reviewed by
* Reviewed date

---

## 10. NFC Card Management

The console must support NFC card management for both Super Admin and Wellness Admin.

### 10.1 NFC Card Types

There are two main card ownership models:

1. Personal user NFC cards
2. Organization / wellness center NFC cards

Same physical NFC card can behave differently for different users only in personal mode.
Organization-owned cards are controlled by the wellness center.

---

### 10.2 Super Admin NFC Features

Super Admin can:

* View all NFC cards
* Search cards by UID, public code, label, organization, user
* Filter by assigned / unassigned / active / inactive
* Create card manually if needed
* Import cards in bulk
* Activate / deactivate cards
* Reassign cards
* View scan history
* View card security metadata
* Delete or soft delete cards

---

### 10.3 Wellness Admin NFC Features

Wellness Admin can:

* View NFC cards belonging to their organization
* Add/register new NFC card
* Edit NFC card label
* Assign card to a member
* Unassign card
* Link card to rhythm template
* Define default activity amount for a card
* Activate / deactivate card
* View card scan history

Example:

* Card name: “Push-up Station 1”
* Activity type: Push-up
* Default amount: 10
* Member scans card
* System records 10 push-ups for that member

---

### 10.4 NFC Card Fields

Required fields:

* ID
* UID or secure card identifier
* Public code / deep link code
* Organization ID, nullable for personal cards
* Owner user ID, nullable
* Assigned member ID, nullable
* Label
* Activity type
* Default amount
* Unit: reps / pages / minutes / kg / custom
* Status: active / inactive / lost / archived
* Created date
* Updated date
* Last scanned date

---

## 11. Rhythm / Goal / Plan Management

The console must support organization-level rhythm templates and member-level assigned rhythms.

### 11.1 Rhythm Concepts

A rhythm is a trackable habit, exercise, or goal.

Examples:

* Push-up
* Walking
* Reading
* French practice
* Weight tracking
* Water intake
* Gym machine usage

A rhythm can have:

* Goal
* Plan
* Frequency
* Unit
* Progress history
* NFC card connection

---

### 11.2 Super Admin Rhythm Features

Super Admin can:

* View all rhythm templates
* Create global rhythm templates
* Manage activity library
* Edit default units
* Edit categories
* View global rhythm usage
* Disable problematic templates

---

### 11.3 Wellness Admin Rhythm Features

Wellness Admin can:

* Create organization rhythm templates
* Edit organization rhythm templates
* Assign rhythm to members
* Assign NFC cards to rhythm
* Set default value per scan
* Set weekly target
* Set monthly target
* Configure progress plan
* View completion rate
* Archive old templates

---

### 11.4 Rhythm Fields

Required fields:

* ID
* Organization ID, nullable for global templates
* Created by
* Name
* Description
* Category
* Unit
* Goal type: increase / decrease / maintain / complete
* Default target
* Frequency: daily / weekly / monthly
* Default scan amount
* Is template
* Status
* Created date
* Updated date

---

## 12. Activity Library

The activity library is used when creating rhythms.

Super Admin can manage global activities.

Wellness Admin can use global activities and optionally create organization-specific activities.

Activity fields:

* Name
* Category
* Unit
* Icon
* Default amount
* Description
* Is global
* Organization ID, nullable
* Status

Categories:

* Exercise
* Wellness
* Reading
* Nutrition
* Learning
* Custom

Units:

* reps
* sets
* pages
* minutes
* steps
* kg
* kcal
* custom

---

## 13. Progress and Activity Logs

Every scan or manual entry creates an activity log.

Activity log fields:

* ID
* User ID
* Organization ID, nullable
* Rhythm ID
* NFC card ID, nullable
* Activity type
* Amount
* Unit
* Source: NFC / manual / admin / import
* Created date
* Created by
* Note

Wellness Admin can view logs only for their organization.

Super Admin can view all logs.

Progress screens must show:

* Daily progress
* Weekly progress
* Monthly progress
* Goal vs actual
* Streak
* Last 4 weeks
* Overachievement above 100%
* Member ranking inside organization

---

## 14. Subscription Management

### 14.1 Subscription Plans

Super Admin can manage plans.

Example plans:

#### Free Personal

* Personal use
* Max 3 NFC cards
* No organization management

#### Personal Pro

* Personal use
* Max 50 NFC cards

#### Wellness Basic

* Max 50 members
* Max 200 NFC cards
* 1 Wellness Admin

#### Wellness Growth

* Max 150 members
* Max 500 NFC cards
* Multiple Wellness Admins

#### Wellness Pro

* Custom limits
* Advanced reports
* Priority support

---

### 14.2 Super Admin Subscription Features

Super Admin can:

* Create plans
* Edit plan limits
* Activate / deactivate plans
* Assign plan to organization
* Override limits for a specific organization
* View billing status
* View usage
* View expired subscriptions

---

### 14.3 Wellness Admin Subscription Features

Wellness Admin can:

* View current plan
* View member limit usage
* View NFC card limit usage
* View renewal date
* View upgrade CTA
* Cannot directly edit plan unless payment system is implemented

---

## 15. Reports

### 15.1 Super Admin Reports

Reports must include:

* Platform usage
* Organization activity
* NFC scan volume
* Active users
* Inactive users
* Subscription distribution
* Revenue summary if billing exists
* Top active organizations
* Error/audit events

### 15.2 Wellness Admin Reports

Reports must include:

* Member activity
* Member progress
* NFC scan history
* Rhythm completion
* Inactive members
* Most used cards
* Weekly/monthly progress
* Export CSV

---

## 16. Audit Logs

Every critical admin action must be logged.

Audit log fields:

* ID
* Actor user ID
* Actor role
* Organization ID, nullable
* Action type
* Target entity type
* Target entity ID
* Old value, JSON
* New value, JSON
* IP address, nullable
* User agent, nullable
* Created date

Actions to log:

* Organization create/update/delete/suspend
* User create/update/deactivate
* NFC card create/update/assign/unassign/deactivate
* Rhythm create/update/delete/assign
* Subscription change
* Join request approve/reject
* Admin login
* Permission-related changes

Super Admin can view all audit logs.
Wellness Admin can view only organization-related audit logs.

---

## 17. Settings

### 17.1 Super Admin Settings

Super Admin can manage:

* Global app name
* Global support email
* Default language
* Available languages
* Default subscription plan
* Maintenance mode
* Feature flags
* Global activity categories
* Global NFC card settings

### 17.2 Wellness Admin Settings

Wellness Admin can manage:

* Organization logo
* Organization contact info
* Organization address
* Default language
* Member approval mode
* NFC scan behavior
* Default rhythm templates
* Notification preferences

---

## 18. Permissions Matrix

| Feature                           | Super Admin |     Wellness Admin |
| --------------------------------- | ----------: | -----------------: |
| View all organizations            |         Yes |                 No |
| Create organization               |         Yes |                 No |
| Edit own organization             |         Yes |                Yes |
| Manage all users                  |         Yes |                 No |
| Manage own members                |         Yes |                Yes |
| Manage Wellness Admins            |         Yes | Limited staff only |
| View all NFC cards                |         Yes |                 No |
| Manage own organization NFC cards |         Yes |                Yes |
| Manage global activities          |         Yes |                 No |
| Create organization activities    |         Yes |                Yes |
| Manage subscription plans         |         Yes |                 No |
| View own subscription usage       |         Yes |                Yes |
| View platform reports             |         Yes |                 No |
| View own organization reports     |         Yes |                Yes |
| View all audit logs               |         Yes |                 No |
| View own audit logs               |         Yes |                Yes |
| System settings                   |         Yes |                 No |
| Organization settings             |         Yes |                Yes |

---

## 19. Data Security Rules

Implement strict Row Level Security or equivalent backend filtering.

Rules:

* Super Admin can access all rows.
* Wellness Admin can access only rows where `organization_id` matches their organization.
* Personal user data must not be visible to Wellness Admin unless the user is a member of their organization.
* NFC cards from another organization must never be visible.
* Join requests must only be visible to the target organization.
* Subscription plan definitions are readable but editable only by Super Admin.
* Audit logs are filtered by role.

Never rely only on frontend hiding. Backend must enforce permissions.

---

## 20. Required Database Tables

Create or update these tables if missing:

* `profiles`
* `organizations`
* `organization_members`
* `organization_admins`
* `join_requests`
* `nfc_cards`
* `rhythms`
* `rhythm_templates`
* `activity_library`
* `activity_logs`
* `subscription_plans`
* `organization_subscriptions`
* `audit_logs`
* `system_settings`
* `organization_settings`

Each table must include:

* `id`
* `created_at`
* `updated_at`
* `created_by`, if relevant
* `organization_id`, where tenant separation is required
* `status`, where lifecycle control is required

---

## 21. UX Requirements

Console must be clean and simple.

General UI rules:

* Use left sidebar navigation.
* Use clear table views.
* Add search and filters on all list pages.
* Add detail pages for organizations, members, NFC cards, rhythms.
* Use status badges.
* Use confirmation dialogs for destructive actions.
* Use empty states.
* Use loading states.
* Use error messages.
* Use success toast notifications.
* Make all forms validation-friendly.
* Responsive desktop-first design.
* Tablet support is required.
* Mobile admin support is nice to have but not mandatory.

---

## 22. List Page Requirements

All list pages must support:

* Search
* Filter
* Sort
* Pagination
* Status badge
* Quick actions
* Detail view
* Create button if permission allows
* Export CSV where useful

Applicable list pages:

* Organizations
* Users
* Wellness Admins
* Members
* Join Requests
* NFC Cards
* Rhythms
* Activity Logs
* Subscriptions
* Audit Logs

---

## 23. Forms

All create/edit forms must include:

* Required field validation
* Clear labels
* Helper text where needed
* Cancel button
* Save button
* Loading state while saving
* Error display
* Success message after save

---

## 24. Detail Pages

Each important entity must have a detail page.

Required detail pages:

* Organization detail
* Member detail
* Wellness Admin detail
* NFC card detail
* Rhythm detail
* Subscription detail

Each detail page should include:

* Summary card
* Status
* Related records
* Recent activity
* Edit action
* Audit history where relevant

---

## 25. Notification / Feedback

Show toast messages for:

* Created successfully
* Updated successfully
* Deleted successfully
* Activated/deactivated successfully
* Assignment completed
* Join request approved
* Join request rejected
* Permission denied
* Validation error
* Unexpected error

---

## 26. Acceptance Criteria

The implementation is complete when:

1. Super Admin can manage all organizations.
2. Super Admin can manage all Wellness Admins.
3. Super Admin can view and manage all users, cards, rhythms, subscriptions, reports, and audit logs.
4. Wellness Admin can access only their organization.
5. Wellness Admin can manage members.
6. Wellness Admin can approve/reject join requests.
7. Wellness Admin can manage organization NFC cards.
8. Wellness Admin can assign NFC cards to members.
9. Wellness Admin can create rhythm templates.
10. Wellness Admin can assign rhythms to members.
11. Wellness Admin can view member progress.
12. Wellness Admin cannot access another organization’s data.
13. Unauthorized routes are blocked.
14. Backend permission checks are implemented.
15. All critical actions create audit logs.
16. All list pages include search/filter/pagination.
17. UI is clean, responsive, and consistent with the Ritim design language.

---

## 27. Technical Expectations

Use the existing project stack.

Expected stack:

* React / Next.js if the console is web-based
* Supabase Auth
* Supabase PostgreSQL
* Supabase Row Level Security
* TypeScript
* Component-based architecture

Create reusable components:

* AdminLayout
* Sidebar
* PageHeader
* DataTable
* StatusBadge
* SearchBar
* FilterBar
* ConfirmDialog
* FormField
* StatCard
* ChartCard
* EmptyState
* LoadingState
* ErrorState

---

## 28. Implementation Priority

### Phase 1 – Core Admin Foundation

* Role-based routing
* Admin layout
* Super Admin dashboard
* Wellness Admin dashboard
* Organizations page
* Members page
* NFC Cards page
* Basic permissions

### Phase 2 – Operational Management

* Join requests
* Rhythm templates
* Member progress
* Card assignment
* Activity logs
* Organization settings

### Phase 3 – Business Management

* Subscription plans
* Organization subscription usage
* Reports
* CSV export
* Audit logs

### Phase 4 – Advanced

* Impersonation/support mode
* Advanced charts
* Bulk NFC card import
* Feature flags
* Billing integration

---

## 29. Important Business Rules

* A Wellness Admin can only manage one organization in the first version.
* A user can belong to a gym organization and still have personal NFC cards.
* Gym-owned NFC cards are controlled by the organization.
* Personal NFC cards are controlled by the user.
* A card scan must create an activity log.
* If the scanned card belongs to an organization and the user is not approved, activity must not be counted for that organization.
* If a user scans an organization NFC card but is not a member, a join request flow should be triggered.
* Subscription limits must be checked before creating members or NFC cards.
* Soft delete should be preferred for business-critical records.

---

## 30. Deliverables

Implement:

* Pages
* Components
* Supabase queries
* Role-based access checks
* RLS policies if missing
* Database migrations if needed
* Types/interfaces
* Form validations
* Audit log creation
* Basic tests for permission rules

Do not implement only the UI.
The feature must work end-to-end with real Supabase data.
