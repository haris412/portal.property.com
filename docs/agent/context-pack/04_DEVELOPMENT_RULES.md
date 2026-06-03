# Development Rules

## Before Making Changes

- Read this context pack.
- Inspect existing components/services first.
- Reuse existing patterns.
- Make the smallest safe change.
- Do not refactor unrelated code.
- Search references before renaming routes, selectors, classes, services, or model fields.

## Angular Rules

- Follow the Angular pattern already used in this repo.
- Continue the standalone component pattern with explicit `imports`.
- Keep `ChangeDetectionStrategy.OnPush` where nearby code uses it.
- Keep TypeScript typed.
- Avoid `any` unless the existing code already requires it or a third-party API forces it.
- Do not break inputs/outputs.
- Do not change template bindings unless required.
- Use signals/computed/input/output where existing neighboring components do.
- Keep route guards and resolver behavior intact unless the task explicitly targets routing/security.

## Styling Rules

- Use existing SCSS/global tokens/classes.
- Do not hardcode colors/font sizes/radii/shadows when tokens exist.
- Do not use `::ng-deep`.
- Preserve existing SCSS nesting/class naming style.
- Do not introduce Tailwind unless the repo already uses it.
- Do not redesign unrelated UI.
- Use Angular Material and existing shared UI styles consistently.
- Keep AG Grid styling aligned with the global `.ag-theme-material` overrides in `src/styles.scss`.

## Component Rules

- Do not create duplicate shared components.
- Keep feature-specific components inside the feature folder.
- Keep reusable components generic.
- Do not mix unrelated feature logic.
- Use `DataGridComponent` and `gridActionsColumnDef` for AG Grid tables unless there is a specific reason not to.
- Use `ConfirmationDialogService` for confirm/delete flows.
- Use `NotificationService` for user-facing notifications.

## Data/Service Rules

- Use existing services.
- Do not duplicate API calls in components if a service exists.
- Keep mock data in the existing mock location.
- Do not silently change model field names.
- Do not change backend contracts unless explicitly asked.
- Keep API response normalization in services.
- Keep list filters/page state consistent with the current service query pattern.
- Keep admin token usage in the existing interceptor/guard/service pattern.

## AI Agent Rules

- Do not perform broad rewrites for small tasks.
- Do not rename files/classes unless necessary.
- Do not change routing/layout unless asked.
- Preserve current behavior.
- Prefer small targeted changes.
- Do not assume user-facing feature behavior applies to admin.
- Clearly mark uncertainty when backend or security behavior is not visible from this repo.

