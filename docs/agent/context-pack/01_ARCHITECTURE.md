# Architecture

## Main Folder Structure

- `src/main.ts`: browser bootstrap entry.
- `src/app/app.config.ts`: application providers, router, HTTP client, translation setup, AG Grid registration, session restore initializer.
- `src/app/app.routes.ts`: top-level routes for public auth, admin lazy routes, and the agent shell.
- `src/app/admin`: admin route tree, admin layout/header, admin pages, admin resolver, admin-only form component.
- `src/app/layout`: shared shell layout, header, and sidebar used by the agent shell and partially reused by admin layout.
- `src/app/features`: feature folders for auth, dashboard, properties, add-listing, profile, appointments, inbox, settings/users, and video-call.
- `src/app/core`: services, guards, interceptor, models, constants, HTTP error helpers.
- `src/app/shared`: reusable UI, dialogs, validators, directives, pipes, utilities.
- `src/environments`: development and production environment config.
- `src/styles.scss`: global design tokens, Material theme setup, Bootstrap/AG Grid/global overrides.
- `src/styles/_theme-colors.scss`: generated Angular Material color palettes.
- `public/assets`: static images, icons, favicons, manifest, and `i18n` JSON files.
- `scripts`: build-time helper scripts, currently i18n asset verification.

## App and Bootstrap Structure

The application uses Angular standalone bootstrap patterns. `app.config.ts` registers:

- router with component input binding and view transitions
- HTTP client with `authInterceptor`
- async animations
- Material dialog provider
- ngx-translate root module with HTTP loader
- `APP_INITIALIZER` that restores both agent and admin sessions
- AG Grid Community module registration

No SSR bootstrap files or server entry points were found.

## Routing Structure

Top-level routing is in `src/app/app.routes.ts`.

Public routes:

- `/auth`
- `/verify-email`
- `/forgot-password`
- `/accept-invite`
- `/login` redirect

Admin routes are lazy loaded from `src/app/admin/admin.routes.ts` at `/admin`.

Admin route tree:

- `/admin/auth`: reused `AuthPortalPageComponent` with `data.mode = 'admin'`
- `/admin/access-denied`
- `/admin/dashboard`
- `/admin/agencies`
- `/admin/add-agency`
- `/admin/users`
- `/admin/add-user`

The admin shell route uses `AdminLayoutComponent` and `adminAuthGuard`. The admin auth page uses `adminAuthPageGuard`.

Agent shell routes exist under `LayoutComponent`, but the root `authGuard` is currently commented out.

## Layout and Shell Structure

Admin layout:

- `src/app/admin/layout/admin-layout.component.ts`
- `src/app/admin/layout/admin-header.component.ts`

`AdminLayoutComponent` reuses the shared `SidebarComponent`, `NotificationContainerComponent`, and the same layout SCSS as the main app shell. Admin navigation is limited to dashboard, agencies, and users.

`AdminHeaderComponent` resolves route titles from router state, shows admin user initials/name, includes the language switcher, and calls `AdminAuthService.logout()`.

Agent layout:

- `src/app/layout/layout.component.ts`
- `src/app/layout/header/header.component.ts`
- `src/app/layout/sidebar/sidebar.component.ts`

The agent layout is present in the repo but is not the same as the admin route tree.

## Feature Folder Organization

Admin feature files are grouped under `src/app/admin`:

- `layout`: admin shell and header
- `pages`: admin dashboard, agencies list, add/edit agency, users list, add/edit user, access denied
- `components`: reusable admin-specific form pieces
- `resolvers`: route resolver for agencies list
- `admin.routes.ts`: admin routing

Agent/user-facing features are under `src/app/features/<feature>`, usually with `pages`, `components`, `services`, `models`, `constants`, `routes`, or mock files depending on the feature.

## Shared and Core Organization

`src/app/shared/ui` contains reusable UI primitives such as page headers, data grids, row action menus, upload dropzones, status badges, cards, and notification container.

`src/app/shared/dialogs` contains confirmation dialog models, service, and component.

`src/app/core/services` contains app-wide services. Admin-important services include `AdminAuthService`, `AdminAgencyService`, `UserService`, `MediaUploadService`, and `NotificationService`.

`src/app/core/models` contains reusable model interfaces. Admin services also define several interfaces inline, such as `AgencyListItem`, `AgencyContact`, and `UserListItem`.

`src/app/core/http` contains shared API error parsing and form error helpers.

## Naming Conventions

- Admin page files use `admin-...-page.component.ts/html/scss`.
- Standalone reusable components are mixed between `.component.ts` naming and shorter names such as `page-header.ts` or `section-card.ts`; match the owning folder's existing convention.
- CSS classes are mostly BEM-style with `block__element` and modifier suffixes.
- Routes are uppercase exported constants such as `ADMIN_ROUTES`, `DASHBOARD_ROUTES`, and `ADD_LISTING_ROUTES`.
- Many components use Angular signals (`signal`, `computed`, `input`, `output`) for local state and component APIs.

## Architecture Rules

- Follow the existing folder structure.
- Keep feature-specific files inside their feature area.
- Reuse shared components before creating new ones.
- Do not duplicate models/services.
- Do not move files unless explicitly asked.
- Do not rewrite architecture for small tasks.
- Keep admin-specific behavior under `src/app/admin` unless it is truly reusable.
- Preserve standalone component imports and OnPush patterns.

