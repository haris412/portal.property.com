# API and Data Flow

The admin side is service-driven. Components manage presentation, reactive forms, signals, and interactions; services own API URLs, query parameters, response normalization, and backend field names.

## AdminAuthService

Path:
`src/app/core/services/admin-auth.service.ts`

Purpose:
Manages admin session, two-step OTP login, role validation, token refresh, session restoration, and logout.

Used By:
`adminAuthGuard`, `adminAuthPageGuard`, `authInterceptor`, admin dashboard/header/pages, app initializer.

Main Methods:
- `requestAdminLoginOtp(payload)`
- `verifyAdminLoginOtp(otpRaw)`
- `refreshAccessToken()`
- `tryRestoreSession()`
- `logout()`
- `clearSessionAndRedirectToAdminLogin()`
- `getCurrentAdminUser()`
- `getAccessToken()`
- `isAdminSession()`

Data Models:
- Reuses `LoginPayload`, `User`, `fromApiUser` from `AuthService`
- Internal auth API response interfaces

Notes:
Admin access token is kept in memory. Refresh token and admin user are stored in browser localStorage. Admin role is validated from API user payload.

## AdminAgencyService

Path:
`src/app/core/services/admin-agency.service.ts`

Purpose:
Handles admin agency CRUD, agency list filtering/pagination, agency user creation/update, and invite resend.

Used By:
Admin agencies list page, add/edit agency page, add/edit agency user page, agency users page, admin agencies resolver.

Main Methods:
- `listAgencies(query)`
- `getAgencyById(id)`
- `createAgency(payload)`
- `updateAgency(id, payload)`
- `deleteAgency(id)`
- `createAgencyUser(agencyId, payload)`
- `updateAgencyUser(agencyId, userId, payload)`
- `resendInvite(agencyId, userId)`

Data Models:
- `ListAgenciesQuery`
- `AgencyContact`
- `AgencyListItem`
- `ListAgenciesResult`
- `CreateAgencyPayload`
- `CreateAgencyUserPayload`
- `AgencyUserItem`
- `UpdateAgencyUserPayload`

Notes:
Base URL is `${environment.apiUrl}/api/admin/agencies`. Responses are normalized defensively. Contacts support a current array format and backward-compatible single contact fields in the normalizer.

## UserService

Path:
`src/app/core/services/user.service.ts`

Purpose:
Handles user list/get/update/delete against `/api/users`.

Used By:
Admin agency users page, add/edit agency user page, profile/account flows.

Main Methods:
- `listUsers(query)`
- `getUserById(id)`
- `updateUser(id, payload)`
- `deleteUser(id)`

Data Models:
- `ListUsersQuery`
- `UserListItem`
- `ListUsersResult`
- `UpdateUserPayload`
- `User`

Notes:
Admin users page passes `createdBy` from the current admin user. Response rows are normalized before components receive them.

## MediaUploadService

Path:
`src/app/core/services/media-upload.service.ts`

Purpose:
Uploads images/videos through upload API endpoints.

Used By:
Admin add/edit agency logo flow and add-listing media flow.

Main Methods:
- `uploadImages(files)`
- `uploadVideo(file)` if present in the service

Data Models:
- Upload response/payload types defined in the service

Notes:
Admin agency logo flow validates file type and max size in the page, then uploads with `uploadImages([file])` before create/update.

## NotificationService

Path:
`src/app/core/services/notification.service.ts`

Purpose:
Signal-backed app notifications.

Used By:
Admin create/edit/list/delete/invite flows and many feature components.

Main Methods:
- `success(message, duration?)`
- `error(message, duration?)`
- `warning(message, duration?)`
- `info(message, duration?)`
- `remove(id)`
- `clear()`

Data Models:
- `Notification`
- `NotificationType`

Notes:
Use this instead of direct alerts for user-visible feedback.

## ConfirmationDialogService

Path:
`src/app/shared/dialogs/confirmation-dialog/confirmation-dialog.service.ts`

Purpose:
Opens reusable confirmation and alert dialogs.

Used By:
Admin agencies and users delete flows.

Main Methods:
- `confirm(data): Observable<boolean>`
- `alert(input): Observable<void>`

Data Models:
- `ConfirmationDialogData`

Notes:
Delete flows pipe `confirm()` through `filter(Boolean)` or equivalent before calling services.

## LanguageService

Path:
`src/app/core/services/language.service.ts`

Purpose:
Manages supported languages and current ngx-translate language.

Used By:
`LanguageSwitcherComponent`, translated admin/user pages.

Main Methods:
- Inspect the service before changing language behavior.

Data Models:
- `SupportedLang`

Notes:
Translation files are in `public/assets/i18n/en.json` and `public/assets/i18n/ur.json`.

## AuthInterceptor

Path:
`src/app/core/interceptors/auth.interceptor.ts`

Purpose:
Attaches bearer tokens and refreshes on `401`.

Used By:
All HTTP requests through Angular `HttpClient`.

Main Methods:
Functional interceptor export `authInterceptor`.

Data Models:
N/A.

Notes:
Uses admin bearer for `/api/admin/*` and while on admin routes, except admin auth/access-denied pages. Auth URLs under `/api/auth` do not receive bearer headers.

## Admin Agencies Resolver

Path:
`src/app/admin/resolvers/admin-agencies.resolver.ts`

Purpose:
Preloads the admin agencies list based on route query parameters and current admin ID.

Used By:
`/admin/agencies` route.

Main Methods:
- `buildListAgenciesQueryFromRoute(route, adminId)`
- `adminAgenciesResolver`

Data Models:
- `AdminAgenciesResolved`
- `ListAgenciesQuery`
- `ListAgenciesResult`

Notes:
Keeps route-query state and service query shape aligned with the page filters.

## Forms and Tables

Admin forms:

- Add/edit agency uses a reactive form with `contacts` as a `FormArray`.
- Add/edit agency user uses a reactive form with agency/user fields and edit-mode query parameters.
- List filters are reactive forms with signals for loading, errors, page, total, and rows.

Admin tables:

- Use `DataGridComponent` with AG Grid `ColDef` arrays.
- Use custom cell renderers for agency logos/status and user status/verification.
- Use `gridActionsColumnDef` for row menus.
- Filtering/pagination is server-driven through services, not AG Grid client filtering.

## Loading and Error Patterns

- Components use `signal(false)` for loading flags.
- Errors are stored as `signal<string | null>`.
- API errors are summarized with `apiErrorSummary`.
- User feedback goes through `NotificationService`.
- Some route preload errors are represented as resolver result objects instead of failed navigation.

## Data Flow Rules

- Keep API calls in services where that is the existing pattern.
- Keep components focused on presentation and interaction.
- Reuse models/interfaces.
- Do not duplicate mock data.
- Do not change field names used by templates.
- Preserve response normalization in services.
- Document uncertainty if backend contracts are unclear.

