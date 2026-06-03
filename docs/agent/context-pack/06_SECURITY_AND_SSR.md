# Security and SSR

## Authentication and Session Handling

Admin authentication is implemented through `AdminAuthService`.

Visible admin flow:

- Step 1: `POST /api/auth/admin/login` with email/password starts OTP sign-in and stores a short-lived `adminChallengeToken`.
- Step 2: `POST /api/auth/admin/login/verify` exchanges OTP plus challenge token for `accessToken`, `refreshToken`, and user data.
- Admin role is validated with `isAdminRoleFromPayload`.
- Access token is held in memory.
- Refresh token is stored in localStorage as `adminRefreshToken`.
- Admin user is stored in localStorage as `adminUser`.
- Logout posts to `/api/auth/logout`, clears admin storage, and navigates to `/admin/auth`.

Agent auth also exists in `AuthService`, but it is separate from admin auth.

## Route Guards

Admin guards:

- `adminAuthGuard`: protects the admin shell route, waits for `tryRestoreSession()`, and redirects to `/admin/auth` if no valid admin session exists.
- `adminAuthPageGuard`: redirects already signed-in admins from `/admin/auth` to `/admin/dashboard`.

Top-level agent shell has `authGuard` imported but commented out in `src/app/app.routes.ts`.

## Token Interceptor

`authInterceptor` attaches bearer tokens for requests under `${environment.apiUrl}/api`.

Important behavior:

- `/api/auth/*` does not receive a bearer token.
- `/api/admin/*` receives the admin bearer token.
- Admin route context can also choose the admin token for API requests while under `/admin/*`.
- `401` responses trigger the corresponding refresh flow.
- Failed admin refresh clears the admin session and redirects to `/admin/auth`.

## Role and Permission Checks

The only explicit admin role check found is in `AdminAuthService.verifyAdminLoginOtp`, where the API user payload must have role `Admin`.

No granular permission system was identified in the inspected files.

## Sensitive Data Handling

Visible patterns:

- Access tokens are kept in memory.
- Refresh tokens are stored in localStorage.
- Admin challenge token is stored in localStorage between login steps.
- `AuthService` comments indicate the normal user storage is intended to avoid PII for the user-facing session, but `AdminAuthService` stores the normalized admin user object.

Do not hardcode credentials, tokens, API secrets, or invite links.

## Environment and Build Config

Environment files:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Important config:

- `apiUrl`
- `translateLoaderPrefix`
- `newRtcUrl`
- GeoNames and Overpass config for location features

Build config:

- `angular.json` uses `@angular/build:application`.
- Production replaces `environment.ts` with `environment.prod.ts`.
- `npm run build` runs Angular build plus `scripts/verify-i18n-assets.cjs`.
- `public/web.config` is copied into build output.

## SSR

SSR was not identified in this repository.

There are no server bootstrap files, no Angular server builder target, and no hydration provider was found in `app.config.ts`.

## Browser-Only Concerns

Even without SSR, browser-only APIs appear in code:

- localStorage in auth services, guarded by `isPlatformBrowser`.
- `window.innerWidth` in layout/sidebar methods.
- `navigator.clipboard` in row menu actions.
- `URL.createObjectURL` and `URL.revokeObjectURL` in logo preview flow.

If SSR is added later, guard browser-only APIs carefully.

## Authentication/Security Uncertainty

Authentication/security behavior is partly clear from frontend files, but backend enforcement is not present in this repository. Do not assume backend permission behavior beyond the frontend routes and services.

## Security and SSR Rules

- Do not expose secrets.
- Do not hardcode credentials/tokens.
- Keep auth checks in existing guard/service patterns.
- Do not add browser-only APIs to SSR paths without guards if SSR exists.
- Do not change environment/build behavior unless asked.
- Keep admin and agent session keys separate.
- Preserve `/api/admin/*` admin-token behavior in the interceptor.

