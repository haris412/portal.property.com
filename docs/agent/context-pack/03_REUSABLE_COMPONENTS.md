# Reusable Components

This file lists reusable components and helpers actually present in this repository. If a pattern already exists here, future AI agents should reuse it instead of creating a duplicate.

## AdminLayoutComponent

Path:
`src/app/admin/layout/admin-layout.component.ts`

Purpose:
Protected admin shell with sidebar, admin header, router outlet, and notification container.

Inputs:
None.

Outputs:
None.

Used In:
`src/app/admin/admin.routes.ts`

Reuse Notes:
Use this shell for admin child routes. Do not create a separate admin layout unless the routing model changes by request.

## AdminHeaderComponent

Path:
`src/app/admin/layout/admin-header.component.ts`

Purpose:
Admin top header with menu toggle, route title, language switcher, user initials/name, user menu, and logout.

Inputs:
None.

Outputs:
`menuToggle`

Used In:
`AdminLayoutComponent`

Reuse Notes:
Extend this component for admin header behavior. It reuses `header.component.scss` from the shared app layout.

## SidebarComponent

Path:
`src/app/layout/sidebar/sidebar.component.ts`

Purpose:
Reusable sidebar navigation for admin and agent shells.

Inputs:
`collapsed`, `mobileOpen`, `brandLink`, `brandLabel`, `brandAriaLabel`, `navItems`, `navAriaLabel`

Outputs:
`collapsedChange`, `mobileClose`

Used In:
`LayoutComponent`, `AdminLayoutComponent`

Reuse Notes:
Provide `SidebarNavItem[]` for new shell navigation. Do not duplicate sidebar markup.

## PageHeaderComponent

Path:
`src/app/shared/ui/page-header/page-header.ts`

Purpose:
Reusable page title/subtitle/meta/actions header.

Inputs:
`title`, `subtitle`, `meta`, `actions`

Outputs:
`actionClicked`

Used In:
Admin agencies and users list pages, plus other feature pages.

Reuse Notes:
Use for admin pages that need consistent header actions. Actions use `PageHeaderAction` with `id`, `label`, optional `variant`, `icon`, and `disabled`.

## DataGridComponent

Path:
`src/app/shared/ui/data-grid/data-grid.component.ts`

Purpose:
Project wrapper around AG Grid with common defaults.

Inputs:
`rowData`, `columnDefs`, `defaultColDef`, `heightPx`, `pagination`, `paginationPageSize`, `rowSelection`, `gridOptionsInput`

Outputs:
`rowClickedEvent`, `gridReady`

Used In:
Admin agencies and users list pages.

Reuse Notes:
Use this wrapper for admin tables. Keep server-driven filters in page/service code when the existing page does that.

## GridRowMenuCellRendererComponent and gridActionsColumnDef

Path:
`src/app/shared/ui/grid-row-menu-cell/grid-row-menu-cell.component.ts`

Purpose:
Reusable AG Grid pinned row action menu.

Inputs:
Provided through AG Grid `params.context.menuItems`.

Outputs:
Runs configured `GridRowMenuItem.action(rowId, rowData)`.

Used In:
Admin agencies and users grids.

Reuse Notes:
Use `gridActionsColumnDef<T>()` and pass `context: { menuItems }` in grid options. Do not hand-roll separate kebab menus in AG Grid cells.

## UploadDropzoneComponent

Path:
`src/app/shared/ui/upload-dropzone/upload-dropzone.ts`

Purpose:
Accessible drag/drop and click-to-upload file picker.

Inputs:
`title`, `subtitle`, `icon`, `accept`, `multiple`, `disabled`

Outputs:
`filesSelected`

Used In:
Admin add/edit agency logo upload and add-listing media flow.

Reuse Notes:
Use for file upload UI. Keep validation in the owning page unless a shared validation need emerges.

## AgencyContactFormComponent

Path:
`src/app/admin/components/agency-contact-form/agency-contact-form.component.ts`

Purpose:
Admin-specific reusable form block for one agency contact inside a `FormArray`.

Inputs:
`contact`, `canBePrimary`, `canRemove`, `isPrimary`

Outputs:
`primaryChange`, `remove`

Used In:
`AdminAddAgencyPageComponent`

Reuse Notes:
Keep it admin-specific. It expects controls named `name`, `email`, and `phone`.

## ConfirmationDialogService and ConfirmationDialogComponent

Path:
`src/app/shared/dialogs/confirmation-dialog/confirmation-dialog.service.ts`

Purpose:
Reusable Angular Material confirmation/alert dialogs.

Inputs:
Service methods accept `ConfirmationDialogData` or alert input.

Outputs:
`confirm()` returns `Observable<boolean>`; `alert()` returns `Observable<void>`.

Used In:
Admin agencies and users delete flows.

Reuse Notes:
Use this service for destructive confirmations instead of creating one-off dialogs.

## NotificationService and NotificationContainerComponent

Path:
`src/app/core/services/notification.service.ts`

Purpose:
App-level toast-like notifications backed by Angular signals.

Inputs:
Methods: `success`, `error`, `warning`, `info`, `show`.

Outputs:
`notifications` signal used by the container.

Used In:
Admin create/edit/list actions, upload errors, invite resend, delete flows.

Reuse Notes:
Use this for user-facing success/error/warning/info messages.

## InfoBannerComponent

Path:
`src/app/shared/ui/info-banner/info-banner.ts`

Purpose:
Simple icon + text banner.

Inputs:
`icon`, `text`

Outputs:
None.

Used In:
Admin agencies and users pages.

Reuse Notes:
Use for non-modal page-level guidance or error/empty messaging where the existing pages do.

## LanguageSwitcherComponent

Path:
`src/app/shared/ui/language-switcher/language-switcher.component.ts`

Purpose:
Switches between configured languages through `LanguageService` and ngx-translate.

Inputs:
None.

Outputs:
None.

Used In:
`AdminHeaderComponent` and other auth/layout areas.

Reuse Notes:
Do not create separate language switching UI for admin.

## StatusBadgeComponent

Path:
`src/app/shared/ui/status-badge/status-badge.ts`

Purpose:
Displays labels for appointment statuses.

Inputs:
`status`

Outputs:
None.

Used In:
Appointments-related UI.

Reuse Notes:
It is appointment-status-specific. For agency/user active status, existing admin pages currently use AG Grid custom cell renderers, not this component.

## SectionCardComponent

Path:
`src/app/shared/ui/section-card/section-card.ts`

Purpose:
Reusable titled card section with optional description and density.

Inputs:
`title`, `description`, `density`

Outputs:
None.

Used In:
Feature form/page areas outside and potentially inside admin.

Reuse Notes:
Use for generic form/page sections instead of creating another card wrapper.

## BreadcrumbComponent

Path:
`src/app/shared/ui/breadcrumb/breadcrumb.component.ts`

Purpose:
Reusable breadcrumb UI.

Inputs:
Inspect the component before use; it is present with template/spec files.

Outputs:
Inspect the component before use.

Used In:
Shared UI library; admin add pages implement their own breadcrumb link in templates.

Reuse Notes:
Prefer this component for new breadcrumb patterns if its API fits.

