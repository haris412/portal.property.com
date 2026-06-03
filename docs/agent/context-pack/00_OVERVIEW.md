# LocateHome Admin Overview

This repository is an Angular admin/dashboard application for the LocateHome property portal. The admin-specific area manages administrator sign-in, agency records, and agency users, while the same repository also contains agent-facing dashboard, listings, profile, appointments, inbox, auth, and video-call feature folders.

## Tech Stack

- Angular `^21.2`
- TypeScript `~5.9` with strict compiler and strict Angular templates
- RxJS `~7.8`
- Angular Material and CDK
- Bootstrap CSS/JS
- AG Grid Community through `ag-grid-angular`
- ngx-translate with JSON files in `public/assets/i18n`
- Leaflet, ECharts/ngx-echarts, and Socket.IO client are installed and used by non-admin feature areas
- Vitest is configured through Angular's unit-test builder

## Angular Pattern

The app uses a standalone-first Angular setup. Bootstrap providers live in `src/app/app.config.ts`; routing lives in `src/app/app.routes.ts`; components declare explicit `imports`. Most admin and shared components use `ChangeDetectionStrategy.OnPush`.

No Angular NgModule application shell was identified. Angular Material modules are imported directly into standalone components or through `importProvidersFrom(MatDialogModule)`.

## Main App Purpose

The admin side provides protected `/admin/*` pages for:

- admin dashboard session landing
- agencies list, filtering, pagination, create, edit, delete
- agency user list, filtering, pagination, create, edit, delete, resend invite
- admin access-denied page
- admin sign-in through a reused auth portal with admin mode

## Main Feature Areas Present

- `src/app/admin`: admin layout, routes, pages, resolver, and agency contact form
- `src/app/features/auth`: shared auth portal, login/signup, forgot-password, invite, email verification
- `src/app/features/dashboard`: agent dashboard widgets and services
- `src/app/features/properties`: property list page and resolver
- `src/app/features/add-listing`: add/edit listing form flow
- `src/app/features/profile`: profile/account/security/availability UI
- `src/app/features/appointments`: appointments page and list
- `src/app/features/inbox`: inbox page and mock/static data
- `src/app/features/video-call`: direct WebRTC video call page

Only the admin-specific features above should be treated as admin functionality. Do not assume every agent-facing feature is part of the admin product.

## Reusable Systems

- App/admin shell: `LayoutComponent`, `AdminLayoutComponent`, `SidebarComponent`, `HeaderComponent`, `AdminHeaderComponent`
- Tables: `DataGridComponent` wrapping AG Grid
- Row actions: `gridActionsColumnDef` and `GridRowMenuCellRendererComponent`
- Page chrome: `PageHeaderComponent`, `InfoBannerComponent`, `BreadcrumbComponent`, `PageShellComponent`, `SectionCardComponent`
- Forms/uploads: `UploadDropzoneComponent`, `AgencyContactFormComponent`, validators
- Feedback: `ConfirmationDialogService`, `NotificationService`, `NotificationContainerComponent`
- Small UI: `StatusBadgeComponent`, `ActionButtonComponent`, chips, segmented controls, metric/stat cards

## Styling and Theming

Global styles are in `src/styles.scss`. The app defines `:root` CSS variables for brand colors, surfaces, text, borders, status colors, shadows, and radii. Angular Material theme colors come from `src/styles/_theme-colors.scss`. Bootstrap, Leaflet, and AG Grid styles are included globally through `angular.json`.

Component styles use SCSS files colocated with components, mostly BEM-like class names and nested selectors. Global AG Grid styling is centralized in `src/styles.scss`.

## Data/API/Mocking Approach

Admin data access is service-driven:

- `AdminAuthService` handles admin OTP login, refresh token restore, localStorage-backed admin session metadata, and logout.
- `AdminAgencyService` handles admin agency and agency-user endpoints under `/api/admin/agencies`.
- `UserService` handles `/api/users` list/get/update/delete.
- `MediaUploadService` uploads agency logos and listing media.

Admin list pages use reactive forms for filters, signals for page state, AG Grid for table display, and services for data. `adminAgenciesResolver` preloads the agencies list from route query parameters.

Mock/static data exists in agent-facing areas such as `features/dashboard/dashboard.mock.ts` and `features/inbox/inbox.data.ts`; no admin-specific mock data source was identified.

## Limitations and Uncertainty

- The repository name/package is `portal-dashboard`, not an explicit admin-only package.
- The codebase contains both admin and agent-facing features. This context pack documents the actual repository and calls out admin-specific files.
- Root agent routes have `authGuard` imported but commented out; admin routes do use guards.
- Backend contracts are inferred from service URLs and normalizers. The backend implementation is not present.
- SSR was not identified in this repository.
- Some source comments/text show mojibake encoding artifacts; docs should stay ASCII unless editing localized text.

## What Future AI Agents Should Know

- Read this context pack before making changes.
- Reuse existing components before creating new ones.
- Preserve the standalone Angular architecture.
- Do not invent new patterns when a local pattern already exists.
- Keep changes scoped to the requested feature.
- Use existing services and models for data/API work.
- Use existing styling tokens/classes from `src/styles.scss`.
- Do not assume agent-facing features are admin features unless routes/files prove it.
- Do not silently alter auth, routing, backend field names, or data normalizers.

