# LocateHome Admin Dashboard Redesign Task Tracker

This file is the single source of truth for the phased LocateHome Admin layout/dashboard redesign. Future Codex runs should only need this prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

## Project Context

- Project: LocateHome Admin Angular project.
- Scope: Admin-side dashboard and admin shell, not the public marketing side.
- Theme direction: Use the newer LocateHome admin root theme: deep blue + gray.
- Do not use the older peach/coral LocateHome theme.
- Goal: Redesign the existing admin layout/dashboard so it feels more polished, cohesive, premium, and production-ready.
- Current sections are enough. Do not add new major dashboard sections.
- Redesign existing sections only.

## Current Phase

Current phase: **All planned dashboard redesign phases complete**

Phase 0 was completed by inspection only. No implementation files were edited during Phase 0.

## User Scope Override - 2026-05-12

The user explicitly stopped the header/sidebar path and clarified:

- Make dashboard redesign implementation changes under `src/app/features/dashboard/**`.
- Do not continue editing `src/app/admin/layout/admin-header.component.html`.
- Do not implement header/sidebar changes in admin/layout or shared layout files as part of this redesign unless the user explicitly reopens that scope.
- Use the provided dashboard reference image as the visual target for all following dashboard changes.

Because Phase 1 and Phase 2 are outside the requested implementation scope, they are marked as deferred by user direction. Continue with Phase 3 and keep dashboard implementation under `src/app/features/dashboard/**`.

## Reference Image Direction

The user provided a dashboard reference image in chat on 2026-05-12. Future runs should follow this visual direction without needing hidden chat context:

- Left sidebar is clean, white, vertically structured, with deep-blue active item.
- Main content uses a white/light-gray page background with generous but compact spacing.
- Top dashboard content has a page title "Dashboard" and subtitle.
- Header/search/actions are visible in the reference, but implementation scope is now dashboard under `src/app/features/dashboard/**`; do not edit shared/admin header unless explicitly asked.
- Welcome/CTA card is a wide deep-blue hero panel with subtle patterning and a real-estate building illustration on the right.
- Welcome copy should read like an admin console: "Welcome back, Admin!" and "Manage your listings, track performance, and grow your real estate business." or the approved wording in this file.
- CTA is a white button with a plus icon and "Add New Property".
- Property overview/stat area is arranged as clean white cards:
  - Larger "Property Overview" card with total portfolio number and sale/rent share mini cards.
  - Four compact stat cards for "For Sale", "For Rent", "Hot Properties", and "Featured Properties".
  - Plan/usage card aligned to the right with progress bar and upgrade CTA.
- Chart and hot locations sit in a two-column row:
  - "Trending Property Views" chart card on the left.
  - "Hot Locations" progress list card on the right.
- Appointments table sits in a full-width card at the bottom.
- Use deep blue accents, gray text, subtle borders, soft shadows, white surfaces, and restrained rounded corners.
- Keep the feel premium, polished, information-dense, and real-estate-admin specific.

## Global Design Direction

- Modern SaaS admin dashboard.
- Deep blue + gray theme.
- Clean white cards.
- Subtle borders.
- Soft shadows.
- Rounded corners.
- Better visual hierarchy.
- Better spacing and alignment.
- Admin-appropriate wording.
- Real-estate admin console feel, not generic template feel.

## Strict Redesign Rules

- Use existing root CSS variables/design tokens only.
- Do not add new design tokens.
- Do not create a new theme file.
- Do not introduce a new color system.
- Do not hardcode new random colors unless absolutely unavoidable.
- Do not use the older peach/coral LocateHome theme.
- Do not use `ng-deep`.
- Use SCSS.
- Preserve existing Angular architecture.
- Keep code strongly typed.
- Preserve standalone/component architecture already used in the project.
- Do not rename routes.
- Do not remove existing functionality.
- Do not change existing data bindings unless absolutely required.
- Do not break existing inputs, outputs, services, route links, or event handlers.
- Reuse existing shared components where possible.
- Prefer extending `app-section-card` through backward-compatible inputs/slots before replacing it with one-off dashboard card wrappers.
- If a reusable component cannot be safely extended without affecting other screens, create a new admin/dashboard-specific component.
- Do not refactor unrelated files.
- Do not scan or rewrite the whole app unnecessarily.
- Do not implement multiple phases in one run.
- Do not jump ahead.

## Ralph Wiggum Method

- Work one small phase at a time.
- Read this markdown file first at the start of every run.
- Identify the current phase from this file.
- Implement only the current phase.
- After completing the phase, update this markdown file.
- Mark a phase complete only if the implementation and checks are successful.
- Record changed files.
- Record what changed.
- Record assumptions/risks.
- Set the next phase as current.
- Add a ready-to-copy next prompt.
- Do not move to the next phase in the same run.

## Per-Run Process

Every future run must:

1. Read `docs/admin-dashboard-redesign-tasks.md`.
2. Find the current phase.
3. Implement only that phase.
4. Avoid unrelated changes.
5. Run available checks such as build/lint/typecheck.
6. Update `docs/admin-dashboard-redesign-tasks.md`.
7. Mark the phase complete only if successful.
8. List changed files.
9. Add notes/risks.
10. Set the next phase as current.
11. Add a ready-to-copy next prompt.

Ready-to-copy next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

## Header Rule

- The fixed global header is shared across admin screens.
- It should not hardcode "Dashboard".
- Keep global actions in the header:
  - Search
  - Notifications
  - Language
  - Admin/profile menu
  - Existing global controls
- The dashboard page title/subtitle should live inside the dashboard page content.
- If a dynamic route title already exists and is cleanly supported, it can be kept, but do not hardcode Dashboard in the shared header.

## Dashboard Sections To Redesign

Do not add new major dashboard sections. Redesign these existing sections only:

1. Welcome / CTA area
2. Property overview stats
3. Plan / usage card
4. Trending property views chart
5. Hot locations card
6. Appointments table

## Admin Wording Guidance

- Prefer: "Dashboard", "Property Overview", "Total Listings", "For Sale", "For Rent", "Hot Properties", "Featured Properties", "Trending Property Views", "Hot Locations", "All Appointments".
- Fix typos like "My Proper".
- Avoid wording that feels too much like an individual owner portfolio dashboard unless the existing product logic requires it.
- Suggested dashboard subtitle: "Monitor listings, appointments, and property activity across LocateHome."
- Suggested welcome text: "Manage listings, track activity, and keep property data up to date."

## Phase Plan

### Phase 0 - Inspect only and create task file

Status: **Complete**

Scope:

- Inspect relevant files.
- Do not edit implementation files.
- Identify:
  - Admin layout/shell component
  - Fixed header component
  - Sidebar component
  - Dashboard page component
  - Dashboard child components
  - Reusable card/table/chart components used by dashboard
  - Existing SCSS/theme token files
- Create `docs/admin-dashboard-redesign-tasks.md`.
- Set Phase 1 as current.

Files inspected:

- `src/app/admin/layout/admin-layout.component.ts`
- `src/app/admin/layout/admin-layout.component.html`
- `src/app/admin/layout/admin-header.component.ts`
- `src/app/admin/layout/admin-header.component.html`
- `src/app/admin/admin.routes.ts`
- `src/app/layout/layout.component.html`
- `src/app/layout/header/header.component.ts`
- `src/app/layout/header/header.component.html`
- `src/app/layout/header/header.component.scss`
- `src/app/layout/sidebar/sidebar.component.html`
- `src/app/layout/sidebar/sidebar.component.ts`
- `src/app/layout/sidebar/sidebar.component.scss`
- `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.ts`
- `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.html`
- `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.scss`
- `src/app/features/dashboard/dashboard.mock.ts`
- `src/app/features/dashboard/components/dashboard-hero-card/dashboard-hero-card.html`
- `src/app/features/dashboard/components/portfolio-breakdown-card/portfolio-breakdown-card.html`
- `src/app/features/dashboard/components/plan-summary-card/plan-summary-card.html`
- `src/app/features/dashboard/components/chart-panel/chart-panel.html`
- `src/app/features/dashboard/components/locations-demand-card/locations-demand-card.html`
- `src/app/features/dashboard/components/appointment-table-card/appointment-table-card.html`
- `src/app/shared/ui/section-card/section-card.html`
- `src/app/shared/ui/metric-tile/metric-tile.html`
- `src/app/shared/ui/page-shell/page-shell.html`
- `src/styles.scss`
- `src/styles/_theme-colors.scss`

Relevant components found:

- Admin shell: `AdminLayoutComponent` in `src/app/admin/layout/admin-layout.component.ts`.
- Admin shell template: `src/app/admin/layout/admin-layout.component.html`.
- Shared application shell styling is reused by admin layout through `../../layout/layout.component.scss`.
- Admin fixed header: `AdminHeaderComponent` in `src/app/admin/layout/admin-header.component.ts`.
- Admin fixed header template: `src/app/admin/layout/admin-header.component.html`.
- Admin header style uses shared header SCSS: `styleUrl: '../../layout/header/header.component.scss'`.
- Sidebar component: `SidebarComponent` in `src/app/layout/sidebar/sidebar.component.ts`.
- Sidebar template/style: `src/app/layout/sidebar/sidebar.component.html` and `src/app/layout/sidebar/sidebar.component.scss`.
- Admin routes: `src/app/admin/admin.routes.ts`.
- Current admin dashboard route points to `AdminDashboardPageComponent` at `src/app/admin/pages/admin-dashboard-page/admin-dashboard-page.component.ts`.
- The richer dashboard UI with the requested redesign sections exists in the dashboard feature as `AgentDashboardPageComponent` at `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.ts`.
- Dashboard child components found:
  - `DashboardHeroCardComponent`
  - `PortfolioBreakdownCardComponent`
  - `PlanSummaryCardComponent`
  - `ChartPanelComponent`
  - `LocationsDemandCardComponent`
  - `AppointmentsTableCardComponent`
  - `DashboardTopbarComponent` exists but is currently imported and not used in `AgentDashboardPageComponent`.

Reusable components found:

- `PageShellComponent` in `src/app/shared/ui/page-shell/`.
- `PageHeaderComponent` in `src/app/shared/ui/page-header/`.
- `SectionCardComponent` in `src/app/shared/ui/section-card/`.
- `MetricTileComponent` in `src/app/shared/ui/metric-tile/`.
- `ActionButtonComponent` in `src/app/shared/ui/action-button/`.
- `AppointmentsListComponent` is used by the appointment table card from the appointments feature.
- `LanguageSwitcherComponent` is used by both generic and admin headers.
- `NotificationContainerComponent` is used by both generic and admin layout shells.

Theme/token files found:

- Root design tokens: `src/styles.scss`.
- Material palette file: `src/styles/_theme-colors.scss`.
- Important theme note: `src/styles.scss` contains the newer deep blue + gray root variables such as `--primary`, `--primary-hover`, `--primary-soft`, `--secondary`, `--tertiary`, `--font-main`, `--font-secondary`, `--surface`, `--surface-page`, `--border-soft`, `--shadow-soft`, and radius/font tokens.
- Risk: `src/styles/_theme-colors.scss` still comments/generated-palettes from older peach/coral values. Future redesign work should avoid pulling colors from that older palette and should use root CSS variables instead.

Phase 0 assumptions/risks:

- There appear to be two dashboard areas:
  - `src/app/admin/pages/admin-dashboard-page/` is the current admin route target.
  - `src/app/features/dashboard/pages/agent-dashboard-page/` contains the richer dashboard sections listed in this redesign plan.
- Future phases must confirm whether the admin route should continue using `AdminDashboardPageComponent`, reuse/mount the richer dashboard feature, or redesign only the existing admin page. Do not change routing unless explicitly required by the current phase.
- Header cleanup should focus on `AdminHeaderComponent` because it is used by `AdminLayoutComponent`.
- `AdminHeaderComponent` already resolves a dynamic title from route metadata, but its template currently renders the title in the shared fixed header. Per the header rule, dashboard title/subtitle should live in dashboard page content and the fixed header should not hardcode "Dashboard".
- Dashboard mock copy currently includes "My Proper" in `PortfolioBreakdownCardComponent`; this should be fixed during the property overview/stat-card phase, not Phase 1.

Changed files in Phase 0:

- `docs/admin-dashboard-redesign-tasks.md`

Checks run in Phase 0:

- Inspection commands only. No build was run because Phase 0 is documentation-only and no implementation files were changed.

### Phase 1 - Header cleanup

Status: **Deferred by user scope override**

Scope:

- Remove hardcoded Dashboard text from fixed/shared header.
- Keep global header actions.
- Ensure dashboard title lives in dashboard page content.
- Preserve behavior.

Implementation guidance:

- Start with `src/app/admin/layout/admin-header.component.html`.
- Keep search, notifications, language switcher, user/admin menu, and menu toggle.
- Do not remove `AdminHeaderComponent` unless the existing architecture clearly supports it.
- If dynamic route title support remains in TS, it may stay if harmless, but do not display a hardcoded Dashboard title in the fixed shared header.
- Do not alter routes during this phase.
- Do not redesign sidebar or dashboard content during this phase.

Completion checklist:

- Header no longer displays hardcoded "Dashboard" in the fixed global admin header.
- Header global actions still render.
- Admin layout still compiles.
- Dashboard page has or keeps a content-level title/subtitle.
- Available checks pass.
- Update this file with changed files, summary, risks, and set current phase to Phase 2.

Phase 1 note:

- The user later clarified that all dashboard redesign implementation changes should be under `src/app/features/dashboard/**`.
- Do not edit `src/app/admin/layout/admin-header.component.html` for this redesign unless explicitly asked.
- Header/sidebar work is out of scope for the current dashboard-only continuation.

### Phase 2 - Sidebar redesign

Status: **Deferred by user scope override**

Scope:

- Redesign sidebar visual styling using existing tokens.
- Keep nav items/routes/collapse behavior.
- Improve active state, spacing, icon alignment, hover states, and hierarchy.

Implementation guidance:

- Start with `src/app/layout/sidebar/sidebar.component.scss`.
- Be careful because this sidebar is shared by both user-facing and admin layouts.
- If admin-specific styling is needed and shared changes would affect non-admin screens too much, consider a scoped admin class from `AdminLayoutComponent` rather than a broad shared rewrite.
- Preserve `SidebarNavItem`, route links, `routerLinkActive`, collapse, and mobile behavior.

Phase 2 note:

- Sidebar implementation is outside `src/app/features/dashboard/**`.
- Do not perform sidebar redesign in this phased dashboard continuation unless the user explicitly reopens sidebar scope.

### Phase 3 - Dashboard page shell

Status: **Complete**

Scope:

- Redesign dashboard container, spacing, max-width if needed, and title/subtitle area.
- Do not alter child component data bindings.
- Keep title/subtitle in page content.

Implementation guidance:

- Use `src/app/features/dashboard/**` as the dashboard implementation area per user direction.
- Do not edit `src/app/admin/pages/admin-dashboard-page/*` in this continuation unless the user explicitly asks.
- Likely files:
  - `src/app/features/dashboard/pages/agent-dashboard-page/*`
  - `src/app/features/dashboard/components/*`
  - `src/app/features/dashboard/dashboard.mock.ts`
- Use suggested subtitle if copy is currently too personal/generic: "Monitor listings, appointments, and property activity across LocateHome."

### Phase 4 - Welcome / CTA redesign

Status: **Complete**

Scope:

- Redesign current welcome/CTA section.
- Keep existing add-property action.
- Use admin-appropriate copy and deep blue/gray styling.

Implementation guidance:

- Likely files:
  - `src/app/features/dashboard/components/dashboard-hero-card/*`
  - `src/app/features/dashboard/dashboard.mock.ts`
  - potentially `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.html`
- Suggested welcome text: "Manage listings, track activity, and keep property data up to date."
- Preserve existing CTA behavior and bindings.

### Phase 5 - Property overview/stat cards redesign

Status: **Complete**

Scope:

- Fix labels/typos.
- Improve hierarchy, icons, spacing, stat-card layout.
- Preserve existing values and bindings.

Implementation guidance:

- Likely files:
  - `src/app/features/dashboard/components/portfolio-breakdown-card/*`
  - `src/app/shared/ui/metric-tile/*` if safe
  - `src/app/features/dashboard/dashboard.mock.ts`
- Fix "My Proper".
- Prefer "Property Overview" and "Total Listings" where appropriate.
- Preserve metric values and bindings.

### Phase 6 - Plan / usage card redesign

Status: **Complete**

Scope:

- Redesign existing plan/usage card.
- Preserve current data and actions.
- Improve rows, progress bar, CTA, spacing.

Implementation guidance:

- Likely files:
  - `src/app/features/dashboard/components/plan-summary-card/*`
  - `src/app/features/dashboard/dashboard.mock.ts` only for wording if needed.
- Preserve `name`, `listingLimit`, `used`, `features`, and `usagePercent()` behavior.

### Phase 7 - Trending property views chart redesign

Status: **Complete**

Scope:

- Redesign chart card styling.
- Keep existing chart library and data.
- Improve contrast, title/subtitle, grid/bar polish.

Implementation guidance:

- Likely files:
  - `src/app/features/dashboard/components/chart-panel/*`
  - `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.ts`
  - `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.html`
- Keep ECharts and existing data.
- Prefer wording "Trending Property Views" rather than "Trending Properties Views".

### Phase 8 - Hot locations card redesign

Status: **Complete**

Scope:

- Redesign existing hot locations card.
- Preserve data and percentages.
- Improve progress bars, spacing, labels, and consistency.

Implementation guidance:

- Likely files:
  - `src/app/features/dashboard/components/locations-demand-card/*`
  - `src/app/features/dashboard/dashboard.mock.ts` only if copy needs adjustment.

### Phase 9 - Responsive and final polish

Status: **Complete**

Scope:

- Review desktop/tablet/mobile behavior.
- Remove unused styles/classes added during redesign.
- Ensure consistency.
- Run final checks.

Implementation guidance:

- Review all files changed across phases.
- Check responsive behavior for admin shell, sidebar, cards, chart, hot locations, and appointments table.
- Run available checks such as build/lint/typecheck.

## Phase Completion Log

### Phase 9 Completion Notes - 2026-05-12

- Completed the responsive and final polish phase.
- Reviewed the dashboard page shell and redesigned dashboard card styles for consistency.
- Improved `SectionCardComponent` full-height behavior so opted-in cards stretch their body content correctly.
- Polished the appointments dashboard card:
  - Opted into dashboard card styling with `variant="dashboard"`.
  - Added `calendar_month` icon and split header layout.
  - Added a "View all appointments" action using the existing appointments navigation method.
  - Added a contained empty state for when no appointments are available.
- Preserved appointment data source, row click behavior, route navigation, and bindings.
- Did not edit admin layout, shared layout shell, admin header, sidebar, routes, services, or admin dashboard files.
- All planned dashboard redesign phases are now complete.

Changed files:

- `src/app/shared/ui/section-card/section-card.scss`
- `src/app/features/dashboard/components/appointment-table-card/appointment-table-card.ts`
- `src/app/features/dashboard/components/appointment-table-card/appointment-table-card.html`
- `src/app/features/dashboard/components/appointment-table-card/appointment-table-card.scss`
- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for admin add-agency page, shared sidebar, inbox conversations, appointments list, and shared header.

Assumptions/risks:

- The "View all appointments" control uses the existing `goToAppointments()` route action; it does not add a new workflow.
- The actual `/admin/dashboard` route still points to `src/app/admin/pages/admin-dashboard-page/*`; this redesign did not change routing because dashboard implementation scope was directed to `src/app/features/dashboard/**`.

Next prompt:

> The planned dashboard redesign phases in docs/admin-dashboard-redesign-tasks.md are complete. Review the dashboard implementation or start a new scoped task.

### Phase 8 Completion Notes - 2026-05-12

- Completed the Hot locations card redesign under `src/app/features/dashboard/**`.
- Kept `LocationsDemandCardComponent` on `app-section-card` and opted into the dashboard card inputs:
  - `variant="dashboard"`
  - `icon="location_on"`
  - `[fullHeight]="true"`
- Preserved the existing `locations()` input, names, percentages, and progress width bindings.
- Improved the card body with ranked location rows, compact labels, deep-blue progress bars, subtle row separators, and responsive spacing.
- Added an accessible progress label for each location bar.
- Removed an unused dashboard-local `ChartWidgetComponent` import from `ChartPanelComponent` after the build surfaced it.
- Did not edit admin layout, shared layout, admin header, sidebar, routes, services, or admin dashboard files.
- Set current phase to Phase 9 - Responsive and final polish.

Changed files:

- `src/app/features/dashboard/components/locations-demand-card/locations-demand-card.html`
- `src/app/features/dashboard/components/locations-demand-card/locations-demand-card.scss`
- `src/app/features/dashboard/components/chart-panel/chart-panel.ts`
- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for admin add-agency page, shared sidebar, inbox conversations, appointments list, and shared header.

Assumptions/risks:

- Rank numbers are presentational and derived from the existing array order.
- The actual `/admin/dashboard` route still points to `src/app/admin/pages/admin-dashboard-page/*`; this phase did not change routing.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

### Section Card Correction Notes - 2026-05-12

- User clarified that `app-section-card` should not be removed everywhere and may be changed to support the current dashboard design through inputs.
- Extended `SectionCardComponent` with backward-compatible inputs:
  - `icon`
  - `variant`
  - `headerLayout`
  - `fullHeight`
- Added a projected `[section-card-actions]` slot for controls such as the chart range dropdown.
- Restored `ChartPanelComponent` to use `app-section-card` with dashboard inputs instead of a fully custom outer card.
- Kept the "Last 7 days" control as a presentational dropdown and did not bind it to chart data.
- Did not use `::ng-deep`.
- Current phase remains Phase 8 - Hot locations card redesign.

Changed files:

- `src/app/shared/ui/section-card/section-card.ts`
- `src/app/shared/ui/section-card/section-card.html`
- `src/app/shared/ui/section-card/section-card.scss`
- `src/app/features/dashboard/components/chart-panel/chart-panel.ts`
- `src/app/features/dashboard/components/chart-panel/chart-panel.html`
- `src/app/features/dashboard/components/chart-panel/chart-panel.scss`
- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for admin add-agency page, shared sidebar, inbox conversations, appointments list, and shared header.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

### Phase 7 Completion Notes - 2026-05-12

- Completed the Trending property views chart redesign under `src/app/features/dashboard/**`.
- Reworked `ChartPanelComponent` styling and later restored the outer wrapper to `SectionCardComponent` through the correction notes above.
- Added a compact chart header with an icon, title/subtitle, and "Last 7 days" range chip.
- Corrected chart title wording from "Trending Properties Views" to "Trending Property Views".
- Preserved the existing ECharts library, lifecycle, resize behavior, chart height input, and data series.
- Tuned the existing chart options for stronger admin-dashboard polish:
  - Deep-blue bars using `--primary`.
  - Dashed grid lines using existing border token.
  - More compact bar width and radius.
  - Improved tooltip padding and axis label contrast.
- Removed unused color lookups from the dashboard page component.
- Did not edit admin layout, shared layout, admin header, sidebar, routes, services, or admin dashboard files.

Changed files:

- `src/app/features/dashboard/components/chart-panel/chart-panel.ts`
- `src/app/features/dashboard/components/chart-panel/chart-panel.html`
- `src/app/features/dashboard/components/chart-panel/chart-panel.scss`
- `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.html`
- `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.ts`
- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for admin add-agency page, shared sidebar, inbox conversations, appointments list, and shared header.

Assumptions/risks:

- The chart range chip is static text because this phase preserves the existing fixed seven-day chart data and does not add filter functionality.
- The actual `/admin/dashboard` route still points to `src/app/admin/pages/admin-dashboard-page/*`; this phase did not change routing.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

### Phase 6 Completion Notes - 2026-05-12

- Completed the Plan / usage card redesign under `src/app/features/dashboard/**`.
- Reworked `PlanSummaryCardComponent` markup into a clearer plan summary layout with:
  - Active/status row.
  - Renewal/listing usage text.
  - Iconized feature rows.
  - Progress percentage and progress bar.
  - Full-width "Upgrade Plan" CTA.
- Preserved the existing plan inputs: `name`, `price`, `renewalText`, `status`, `listingLimit`, `used`, and `features`.
- Preserved the existing `usagePercent()` computation.
- Replaced the previous shared `ActionButtonComponent` usage with a local feature-scoped button so the visual treatment stays inside `features/dashboard`.
- Added `MatIconModule` and a small `featureIcon()` helper for feature-row icons.
- Cleaned the encoded separator in the plan description string by using a plain ASCII hyphen.
- Did not edit admin layout, shared layout, admin header, sidebar, routes, services, or admin dashboard files.

Changed files:

- `src/app/features/dashboard/components/plan-summary-card/plan-summary-card.ts`
- `src/app/features/dashboard/components/plan-summary-card/plan-summary-card.html`
- `src/app/features/dashboard/components/plan-summary-card/plan-summary-card.scss`
- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for shared sidebar, appointments list, shared header, admin add-agency page, and inbox conversations.

Assumptions/risks:

- The CTA remains a local button with no new action handler because the previous `app-action-button` did not bind a click handler here.
- The actual `/admin/dashboard` route still points to `src/app/admin/pages/admin-dashboard-page/*`; this phase did not change routing.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

### Phase 5 Completion Notes - 2026-05-12

- Completed the Property overview/stat cards redesign under `src/app/features/dashboard/**`.
- Fixed the section title typo by replacing "My Proper" with "Property Overview".
- Kept the existing overview/stat values and dashboard bindings.
- Replaced shared `MetricTileComponent` usage inside the dashboard portfolio card with feature-local metric card markup so styling stays under `features/dashboard`.
- Added a larger "Total Listings" overview card with sale/rent share mini cards.
- Added four compact local stat cards for the existing metrics: "For Sale", "For Rent", "Hot Properties", and "Featured Properties".
- Updated overview supporting copy in `dashboard.mock.ts` to be more admin-appropriate.
- Removed `MetricTileComponent` from the portfolio card imports and used `MatIconModule` for local dashboard metric icons.
- Did not edit shared metric tile styles, admin layout, shared layout, admin header, sidebar, routes, services, or admin dashboard files.

Changed files:

- `src/app/features/dashboard/components/portfolio-breakdown-card/portfolio-breakdown-card.ts`
- `src/app/features/dashboard/components/portfolio-breakdown-card/portfolio-breakdown-card.html`
- `src/app/features/dashboard/components/portfolio-breakdown-card/portfolio-breakdown-card.scss`
- `src/app/features/dashboard/dashboard.mock.ts`
- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for shared header, shared sidebar, admin add-agency page, appointments list, and inbox conversations.

Assumptions/risks:

- The redesign intentionally avoids editing `src/app/shared/ui/metric-tile/*` to honor the user instruction that dashboard implementation changes should stay under `src/app/features/dashboard/**`.
- The actual `/admin/dashboard` route still points to `src/app/admin/pages/admin-dashboard-page/*`; this phase did not change routing.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

### Phase 4 Completion Notes - 2026-05-12

- Completed the Welcome / CTA redesign under `src/app/features/dashboard/**`.
- Reworked `DashboardHeroCardComponent` from a generic `SectionCardComponent` wrapper into a dedicated dashboard welcome panel.
- Preserved the existing add-property action by keeping `onCta()` and its `/add-listing` navigation.
- Updated the hero copy in `dashboard.mock.ts`:
  - Title: "Welcome back, Admin!"
  - Description: "Manage your listings, track performance, and grow your real estate business."
  - CTA label remains "Add New Property".
- Added a deep-blue hero surface, white CTA button, subtle dashboard styling, and a scoped CSS real-estate building visual.
- Used existing root tokens and `color-mix()` with existing tokens; no new design tokens or theme files were added.
- Did not edit admin layout, shared layout, admin header, sidebar, routes, services, or admin dashboard files.

Changed files:

- `src/app/features/dashboard/components/dashboard-hero-card/dashboard-hero-card.ts`
- `src/app/features/dashboard/components/dashboard-hero-card/dashboard-hero-card.html`
- `src/app/features/dashboard/components/dashboard-hero-card/dashboard-hero-card.scss`
- `src/app/features/dashboard/dashboard.mock.ts`
- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- `npm run build` - passed.
- First build surfaced a new `dashboard-hero-card.scss` component style budget warning; the hero CSS was trimmed and the second build passed without that new warning.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for shared header, shared sidebar, admin add-agency page, appointments list, and inbox conversations.

Assumptions/risks:

- The real-estate building visual is CSS-based to keep the phase self-contained and avoid adding image assets.
- The reference image includes header/sidebar changes, but this phase intentionally stayed within `src/app/features/dashboard/**` per user scope.
- The actual `/admin/dashboard` route still points to `src/app/admin/pages/admin-dashboard-page/*`; this phase did not change routing.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

### Phase 3 Completion Notes - 2026-05-12

- Completed the dashboard page shell phase under `src/app/features/dashboard/**`.
- Replaced the shared page-header usage in `AgentDashboardPageComponent` with a local feature-scoped dashboard header.
- Set the page title to "Dashboard".
- Set the page subtitle to "Monitor listings, appointments, and property activity across LocateHome."
- Added a scoped `.agent-dashboard-page` wrapper with compact max-width, spacing, header, title, subtitle, and stack styles.
- Preserved all existing child component data bindings for hero, property overview, plan, chart, hot locations, and appointments.
- Removed unused `PageHeaderComponent` and `DashboardTopbarComponent` imports from the dashboard page component.
- Did not edit admin layout, shared layout, admin header, sidebar, routes, services, or dashboard child components.

Changed files:

- `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.html`
- `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.scss`
- `src/app/features/dashboard/pages/agent-dashboard-page/agent-dashboard-page.ts`
- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for sidebar, appointments list, inbox conversations, admin add-agency page, and shared header SCSS.

Assumptions/risks:

- Per user direction, dashboard implementation changes were made under `src/app/features/dashboard/**`.
- The actual `/admin/dashboard` route still points to `src/app/admin/pages/admin-dashboard-page/*`; this phase did not change routing because route changes are out of scope.
- Future phases should continue editing dashboard visuals under `src/app/features/dashboard/**`.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

### Scope Override Notes - 2026-05-12

- User interrupted Phase 1 and clarified that redesign implementation changes must be made under `src/app/features/dashboard/**`.
- The admin header/sidebar phases are deferred by user direction.
- The task tracker now sets the current phase to Phase 3 - Dashboard page shell.
- Future dashboard redesign work should use the written reference-image direction above.
- Do not edit `src/app/admin/layout/*`, `src/app/layout/*`, or `src/app/admin/pages/admin-dashboard-page/*` as part of the current dashboard-only continuation unless explicitly asked.
- The user specifically said: "for dashboard make changes under features/".

Changed files:

- `docs/admin-dashboard-redesign-tasks.md`

Checks run:

- No build run. This update is documentation-only and no implementation files were changed.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.

### Phase 0 Completion Notes

- Created this self-contained task tracker.
- Inspected admin layout, shared layout, admin header, sidebar, admin routes, dashboard page/components, reusable UI components, and theme/token files.
- Did not edit implementation files.
- Set current phase to Phase 1 - Header cleanup.

Changed files:

- `docs/admin-dashboard-redesign-tasks.md`

Assumptions/risks:

- The requested dashboard sections match the richer `AgentDashboardPageComponent`, while the `/admin/dashboard` route currently points at `AdminDashboardPageComponent`. Future phases must confirm the correct implementation target before making dashboard content changes.
- Shared sidebar/header SCSS may affect non-admin screens; prefer scoped changes if a visual change would be admin-specific.
- Root CSS variables are the trusted design source; the generated Material palette file still reflects older peach/coral values.

Next prompt:

> Read docs/admin-dashboard-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, run available checks, then update the markdown with completed work, changed files, risks, and the next phase. Do not jump ahead.
