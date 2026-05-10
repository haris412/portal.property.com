# Implemented Features

This file documents features that are visible in this repository. Admin-specific features are listed first. Agent-facing features also exist in this repo, but should not be treated as admin functionality unless a task explicitly crosses that boundary.

## Admin Authentication

### Purpose

Allows administrators to sign in through the shared auth portal using admin mode. Admin login is a two-step OTP flow backed by `AdminAuthService`.

### Main Files

- `src/app/admin/admin.routes.ts`
- `src/app/features/auth/pages/auth-portal-page/auth-portal-page.component.ts`
- `src/app/features/auth/components/login-card/login-card.component.ts`
- `src/app/core/services/admin-auth.service.ts`
- `src/app/core/guards/admin-auth.guard.ts`
- `src/app/core/interceptors/auth.interceptor.ts`

### Components Used

- `AuthPortalPageComponent`
- auth hero/login/signup components from `features/auth`
- `LanguageSwitcherComponent`

### Data/Services

- `AdminAuthService`
- `authInterceptor`
- `adminAuthGuard`
- `adminAuthPageGuard`

### Current Behavior

`/admin/auth` renders the shared auth portal with `data.mode = 'admin'`. Admin sign-in requests an OTP through `/api/auth/admin/login`, stores `adminChallengeToken`, verifies OTP through `/api/auth/admin/login/verify`, validates role `Admin`, stores admin refresh/user data in localStorage, and keeps the access token in memory.

### Notes for Future AI Agents

Do not merge agent and admin auth flows. Keep admin session keys separate: `adminRefreshToken`, `adminUser`, and `adminChallengeToken`.

## Admin Layout and Navigation

### Purpose

Provides the protected admin shell with sidebar navigation, header, route outlet, and notifications.

### Main Files

- `src/app/admin/layout/admin-layout.component.ts`
- `src/app/admin/layout/admin-layout.component.html`
- `src/app/admin/layout/admin-header.component.ts`
- `src/app/admin/layout/admin-header.component.html`
- `src/app/layout/sidebar/sidebar.component.ts`
- `src/app/layout/layout.component.scss`
- `src/app/layout/header/header.component.scss`

### Components Used

- `SidebarComponent`
- `AdminHeaderComponent`
- `NotificationContainerComponent`
- `LanguageSwitcherComponent`

### Data/Services

- `AdminAuthService`
- Angular `Router`
- `TranslateModule`

### Current Behavior

Admin navigation includes dashboard, agencies, and users. The admin header resolves the current route title, displays the admin user's name/initials, supports a user menu, language switching, and logout.

### Notes for Future AI Agents

Reuse the shared sidebar/header styling. Do not create a second admin sidebar unless explicitly asked.

## Admin Dashboard

### Purpose

Serves as the initial protected admin landing page.

### Main Files

- `src/app/admin/pages/admin-dashboard-page/admin-dashboard-page.component.ts`
- `src/app/admin/pages/admin-dashboard-page/admin-dashboard-page.component.html`
- `src/app/admin/pages/admin-dashboard-page/admin-dashboard-page.component.scss`

### Components Used

- Uses `AsyncPipe`; no complex child admin dashboard widgets were identified.

### Data/Services

- `AdminAuthService.currentAdminUser$`

### Current Behavior

Displays information derived from the current admin user and exposes a `logout()` method that calls `AdminAuthService.logout()`.

### Notes for Future AI Agents

Do not invent dashboard metrics unless they are backed by actual services or a task explicitly asks for mock content.

## Admin Agencies

### Purpose

Lists agencies created by the current admin, with server-driven filters, pagination, row actions, create/edit navigation, and delete confirmation.

### Main Files

- `src/app/admin/pages/admin-agencies-page/admin-agencies-page.component.ts`
- `src/app/admin/pages/admin-agencies-page/admin-agencies-page.component.html`
- `src/app/admin/pages/admin-agencies-page/admin-agencies-page.component.scss`
- `src/app/admin/resolvers/admin-agencies.resolver.ts`
- `src/app/core/services/admin-agency.service.ts`

### Components Used

- `PageHeaderComponent`
- `InfoBannerComponent`
- `DataGridComponent`
- `GridRowMenuCellRendererComponent` through `gridActionsColumnDef`
- `ConfirmationDialogService`
- Angular Material form fields, select, input, buttons, icons, spinner

### Data/Services

- `AdminAgencyService.listAgencies`
- `AdminAgencyService.deleteAgency`
- `AdminAuthService.getCurrentAdminUser`
- `NotificationService`
- `TranslateService`
- `adminAgenciesResolver`

### Current Behavior

The route resolver loads agencies before activation using query parameters and the current admin ID. The page keeps filters in a reactive form, debounces search, uses signals for loading/error/list/page state, displays agencies in AG Grid, and offers row actions for edit, add user, copy ID, and delete.

### Notes for Future AI Agents

The grid is server-driven. Do not enable AG Grid client sorting/filtering as a replacement for the existing service query flow unless specifically requested.

## Add/Edit Agency

### Purpose

Creates or updates an agency, including name, optional location, logo upload/preview, and one or more contacts.

### Main Files

- `src/app/admin/pages/admin-add-agency-page/admin-add-agency-page.component.ts`
- `src/app/admin/pages/admin-add-agency-page/admin-add-agency-page.component.html`
- `src/app/admin/pages/admin-add-agency-page/admin-add-agency-page.component.scss`
- `src/app/admin/components/agency-contact-form/agency-contact-form.component.ts`
- `src/app/core/services/admin-agency.service.ts`
- `src/app/core/services/media-upload.service.ts`

### Components Used

- `UploadDropzoneComponent`
- `AgencyContactFormComponent`
- Angular Material button, form field, input, icon, card, spinner

### Data/Services

- `AdminAgencyService.createAgency`
- `AdminAgencyService.updateAgency`
- `AdminAgencyService.getAgencyById`
- `MediaUploadService.uploadImages`
- `NotificationService`

### Current Behavior

The page detects edit mode through the `agencyId` query parameter. Create mode starts with one primary contact. Edit mode loads the agency, rebuilds the contacts `FormArray`, and preserves or replaces the logo. On submit, it validates the form, uploads a pending logo if selected, guarantees one primary contact, and sends create/update payloads through `AdminAgencyService`.

### Notes for Future AI Agents

Preserve the `contacts` array model and primary-contact behavior. Do not fall back to legacy single contact fields in the form; backward compatibility is handled in the service normalizer.

## Admin Agency Users

### Purpose

Lists users created by the current admin, with filters, pagination, row actions, resend invite, edit, copy ID, and delete.

### Main Files

- `src/app/admin/pages/admin-agency-users-page/admin-agency-users-page.component.ts`
- `src/app/admin/pages/admin-agency-users-page/admin-agency-users-page.component.html`
- `src/app/admin/pages/admin-agency-users-page/admin-agency-users-page.component.scss`
- `src/app/core/services/user.service.ts`
- `src/app/core/services/admin-agency.service.ts`

### Components Used

- `PageHeaderComponent`
- `InfoBannerComponent`
- `DataGridComponent`
- `GridRowMenuCellRendererComponent` through `gridActionsColumnDef`
- `ConfirmationDialogService`
- Angular Material form field, input, select, button, icon, spinner

### Data/Services

- `UserService.listUsers`
- `UserService.deleteUser`
- `AdminAgencyService.resendInvite`
- `AdminAuthService.getCurrentAdminUser`
- `NotificationService`
- `TranslateService`

### Current Behavior

The page loads users for the current admin, provides search/status/role/sort/page-size filters, renders status and email verification chips with custom AG Grid cell renderers, and exposes row actions for copy ID, edit, resend invite for inactive users, and delete.

### Notes for Future AI Agents

Keep list state in signals and data access in services. Do not duplicate user API calls inside templates or new helper components.

## Add/Edit Agency User

### Purpose

Creates an agency user and sends an invite, or edits an existing agency user.

### Main Files

- `src/app/admin/pages/admin-add-agency-user-page/admin-add-agency-user-page.component.ts`
- `src/app/admin/pages/admin-add-agency-user-page/admin-add-agency-user-page.component.html`
- `src/app/admin/pages/admin-add-agency-user-page/admin-add-agency-user-page.component.scss`
- `src/app/core/services/admin-agency.service.ts`
- `src/app/core/services/user.service.ts`

### Components Used

- Angular Material form field, input, select, button, icon, spinner
- RouterLink

### Data/Services

- `AdminAgencyService.listAgencies`
- `AdminAgencyService.createAgencyUser`
- `AdminAgencyService.updateAgencyUser`
- `UserService.getUserById`
- `NotificationService`
- `TranslateService`

### Current Behavior

The page loads active agencies for a dropdown. It detects edit mode from `userId` query parameter and can preselect/disable agency from `agencyId`. Create mode posts `roleName: 'Agent'` and expects invite email behavior from the backend. Edit mode loads user data and disables agency selection.

### Notes for Future AI Agents

Do not silently change the create payload role from `Agent`. If role selection is needed, add it deliberately and update backend contract assumptions.

## Admin Access Denied

### Purpose

Displays a route for denied admin access.

### Main Files

- `src/app/admin/pages/admin-access-denied-page/admin-access-denied-page.component.ts`
- `src/app/admin/pages/admin-access-denied-page/admin-access-denied-page.component.html`
- `src/app/admin/pages/admin-access-denied-page/admin-access-denied-page.component.scss`

### Components Used

- Angular Material icon/button modules if present in the component file.

### Data/Services

- No API service dependency was identified from the route declaration.

### Current Behavior

Accessible at `/admin/access-denied`.

### Notes for Future AI Agents

Keep this page simple unless a real permission model is added.

## Shared Auth and Account Recovery

### Purpose

Provides public auth, email verification, forgot-password, and invite set-password flows reused by both admin and agent paths where configured.

### Main Files

- `src/app/features/auth/*`
- `src/app/core/services/auth.service.ts`
- `src/app/core/services/password-reset-flow.service.ts`
- `src/app/core/guards/password-reset-flow.guard.ts`

### Components Used

- `AuthPortalPageComponent`
- `LoginCardComponent`
- `SignupCardComponent`
- `AuthHeroPanelComponent`
- forgot-password shell and steps
- invite set-password component
- verify-email component

### Data/Services

- `AuthService`
- `AdminAuthService` for admin mode
- password reset flow service/guards

### Current Behavior

The public auth portal supports agent and admin modes. Password reset and invite flows use child routes under shell components.

### Notes for Future AI Agents

Admin login mode is route-data-driven. Do not split it unless explicitly requested.

