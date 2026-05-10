# LocateHome Admin Browser AI Context

## Project Summary

This is an Angular 21 LocateHome admin/dashboard repository. It uses standalone Angular components, strict TypeScript/templates, Angular Material, Bootstrap, AG Grid, ngx-translate, RxJS, and SCSS. The admin side manages admin login, agencies, and agency users. The repo also contains agent-facing features, so do not assume every feature folder is admin functionality.

## Architecture Summary

- Bootstrap/providers: `src/app/app.config.ts`
- Top-level routes: `src/app/app.routes.ts`
- Admin routes: `src/app/admin/admin.routes.ts`
- Admin layout/header/pages: `src/app/admin/layout`, `src/app/admin/pages`
- Admin-specific component: `src/app/admin/components/agency-contact-form`
- Shared layout/sidebar/header: `src/app/layout`
- Shared UI/dialogs: `src/app/shared`
- Core services/guards/interceptor/models: `src/app/core`
- Global styles/tokens: `src/styles.scss`
- i18n JSON: `public/assets/i18n`

The app is standalone-first. Admin routes are protected by `adminAuthGuard`; `/admin/auth` uses `adminAuthPageGuard`.

## Implemented Features

- Admin OTP login through shared auth portal admin mode.
- Admin protected shell with sidebar, header, user menu, language switcher, and notifications.
- Admin dashboard landing page.
- Agencies list with server-driven filters, pagination, AG Grid, row actions, delete confirmation.
- Add/edit agency form with logo upload and contact `FormArray`.
- Agency users list with server-driven filters, AG Grid status cells, edit/resend/delete/copy actions.
- Add/edit agency user form with active agency selection.
- Admin access-denied page.
- Public auth, forgot-password, invite, and verify-email flows also exist.

## Reusable Components

- `SidebarComponent`: reuse for shell navigation.
- `AdminHeaderComponent`: admin topbar behavior.
- `PageHeaderComponent`: page title/actions.
- `DataGridComponent`: AG Grid wrapper for tables.
- `gridActionsColumnDef`: standard row action menu column.
- `UploadDropzoneComponent`: drag/drop upload UI.
- `AgencyContactFormComponent`: admin agency contact form row.
- `ConfirmationDialogService`: confirmations/alerts.
- `NotificationService` + `NotificationContainerComponent`: app notifications.
- `InfoBannerComponent`: page-level info/error text.
- `LanguageSwitcherComponent`: language switching.

## Styling System

Use SCSS and existing tokens from `src/styles.scss`: `--primary`, `--primary-hover`, `--secondary`, `--tertiary`, `--font-main`, `--font-secondary`, `--surface`, `--surface-soft`, `--surface-page`, `--border-soft`, `--border-card-soft`, `--shadow-soft`, radius tokens, and status tokens.

Angular Material theme palettes are in `src/styles/_theme-colors.scss`. AG Grid global theme overrides are in `src/styles.scss`. Component styles use colocated `.scss` files and BEM-like class names.

## API and Data Flow

- `AdminAuthService`: admin OTP login, token refresh, admin session.
- `AdminAgencyService`: `/api/admin/agencies` CRUD, agency users, resend invite.
- `UserService`: `/api/users` list/get/update/delete.
- `MediaUploadService`: uploads agency logos/listing media.
- `authInterceptor`: attaches admin bearer token for `/api/admin/*`.
- `adminAgenciesResolver`: preloads agencies from query params.

Admin list pages use reactive filter forms, Angular signals for state, services for data, and AG Grid for rendering. Do not duplicate API calls in components when services exist.

## Security and SSR

Admin auth stores `adminRefreshToken`, `adminUser`, and `adminChallengeToken` in localStorage; the access token is in memory. Admin role is checked after OTP verification. Admin routes are guarded.

SSR was not identified in this repository. Browser-only APIs still exist, including localStorage, window sizing, clipboard, and object URLs.

## Non-Negotiable Rules

- Do not change architecture unless asked.
- Reuse existing components.
- Preserve bindings and data flow.
- Use existing services/models.
- Use existing SCSS tokens/classes.
- Do not use `::ng-deep`.
- Do not create duplicate components.
- Keep changes scoped.
- Do not redesign unrelated UI.
- Do not mix admin and agent auth/session behavior.
- Do not invent admin features not present in the code.

## Example Prompts

“Using the LocateHome Admin Browser AI Context, update the dashboard card spacing only. Reuse existing card styles and do not touch services or routes.”

“Using the LocateHome Admin Browser AI Context, add a new status chip style for inactive records. Use existing SCSS tokens and do not create a new chip component.”

“Using the LocateHome Admin Browser AI Context, improve the listings table empty state. Keep the current layout and data flow.”

