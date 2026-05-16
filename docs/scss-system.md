# SCSS and Styling System

## Global Styles Location

Global styling is centralized in:

- `src/styles.scss`
- `src/styles/_theme-colors.scss`

`angular.json` also includes these global CSS files:

- Angular Material prebuilt theme: `@angular/material/prebuilt-themes/indigo-pink.css`
- Bootstrap: `node_modules/bootstrap/dist/css/bootstrap.min.css`
- Leaflet: `node_modules/leaflet/dist/leaflet.css`
- AG Grid: `node_modules/ag-grid-community/styles/ag-grid.min.css`
- AG Grid Quartz: `node_modules/ag-grid-community/styles/ag-theme-quartz.min.css`
- App global styles: `src/styles.scss`

`src/styles.scss` additionally imports AG Grid CSS and material theme styles.

## Root CSS Variables

The repo defines a `:root` design-token layer in `src/styles.scss`.

Detected token groups:

- font family
- brand colors
- text colors
- surface colors
- border colors
- status colors
- snackbar/accent color
- shadow
- radius
- Angular Material CSS variable overrides
- overlay/backdrop colors
- purpose/status/badge/accent colors
- dark surfaces
- brand gradient variables

## Brand Colors

Important brand tokens:

- `--primary`
- `--primary-hover`
- `--primary-strong`
- `--primary-soft`
- `--primary-soft-hover`
- `--primary-cta-hover`
- `--secondary`
- `--tertiary`

The current CSS variable brand palette is deep blue/slate with soft blue-gray surfaces. `src/styles/_theme-colors.scss` comments mention generated Material palettes from a different seed. Treat the live `:root` tokens as the app-level styling source unless deliberately changing the theme.

## Text Colors

Detected text tokens:

- `--font-main`
- `--font-secondary`
- `--status-success-text`
- `--status-confirmed-text`
- `--status-booked-text`
- `--status-blocked-text`
- `--status-unavailable-text`
- `--error-strong`
- `--purpose-rent-text`
- `--purpose-sale-text`
- `--status-highlight-text`

Typography scale tokens are present in `:root`.

## Surface Colors

Detected surface tokens:

- `--surface`
- `--surface-soft`
- `--surface-muted`
- `--surface-page`
- `--surface-disabled`
- `--surface-footer`
- `--surface-frost`
- `--surface-dark`
- `--surface-dark-muted`
- `--surface-black`

Some component styles refer to `--surface-white`, but that token was not identified in the inspected global `:root`. Use existing defined tokens unless a task explicitly asks to add missing tokens.

## Border, Radius, and Shadow Tokens

Border tokens:

- `--border-soft`
- `--border-soft-strong`
- `--border-field`
- `--border-field-hover`
- `--border-white-soft`
- `--border-card-soft`

Radius tokens:

- `--radius-xl`
- `--radius-lg`
- `--radius-md`
- `--radius-sm`
- `--radius-field`
- `--radius-pill`

Shadow token:

- `--shadow-soft`

Component styles sometimes use additional local shadows directly. Prefer `--shadow-soft` where it fits before adding new values.

## Typography

Global font family:

- `--font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, sans-serif`

Size tokens:

- `--font-size-display`
- `--font-size-h1`
- `--font-size-h2`
- `--font-size-h3`
- `--font-size-h4`
- `--font-size-h5`
- `--font-size-h6`
- `--font-size-body-lg`
- `--font-size-body`
- `--font-size-body-sm`
- `--font-size-caption`
- `--font-size-overline`

Line-height tokens:

- `--line-height-display`
- `--line-height-heading`
- `--line-height-body`
- `--line-height-compact`

Weight tokens:

- `--font-weight-regular`
- `--font-weight-medium`
- `--font-weight-semibold`
- `--font-weight-bold`
- `--font-weight-heavy`

Angular Material theme uses `Plus Jakarta Sans`.

Some component styles still use local `font-size`, `font-weight`, and `line-height` values. When changing typography, prefer existing typography tokens where practical and match nearby component conventions.

## Status Tokens

Status and semantic tokens:

- `--success`
- `--error`
- `--warning`
- `--info`
- `--standby`
- status text tokens
- purpose rent/sale border/background/text tokens
- badge accent tokens

Admin grid status pills currently use inline `color-mix(...)` style strings inside AG Grid cell renderers. Keep those aligned with root status tokens.

## Angular Material Overrides

`src/styles.scss` customizes Material CSS variables, including:

- outlined text field outline/hover/focus colors
- text field label/input colors
- field/container shape
- selected option label color
- button fonts and outlined button shape

Component files import Angular Material modules directly. Avoid adding global Material overrides unless the change applies broadly.

## Bootstrap and Grid Usage

Bootstrap CSS and JS are globally included. Component templates may use Bootstrap utility classes.

AG Grid is a major reusable table system. Global `.ag-theme-material` overrides in `src/styles.scss` define row hover colors, selected row background, fonts, borders, row sizes, pagination panel behavior, focus borders, menu field styles, and dashboard grid tweaks.

## SCSS Nesting and Class Naming

Component styles are colocated beside components. Common patterns:

- BEM-like classes such as `.admin-agencies-page__container`
- nested element selectors inside a block
- modifier classes with `--active`, `--empty`, `--collapsed`
- Angular Material class overrides in global styles
- shared layout styles reused by admin components through `styleUrl` references

Some files contain `::ng-deep` in existing code. Future changes should avoid adding new `::ng-deep`.

## Component Styling Patterns

Admin pages generally use:

- `--surface`, `--surface-soft`, `--font-main`, `--font-secondary`
- `--border-soft`, `--border-soft-strong`
- `--radius-field`, `--radius-xl`
- `--shadow-soft`
- Angular Material controls
- AG Grid wrapper and global AG Grid theme

Use existing shared components and classes before creating new page-specific wrappers.

## Styling Rules for Future Changes

- Prefer existing root tokens over hardcoded colors.
- Prefer typography tokens over component-level font-size values if tokens exist.
- Prefer existing typography tokens over new component-level font-size values where practical.
- Do not use `::ng-deep`.
- Preserve current class naming and SCSS nesting style.
- Do not introduce Tailwind unless already used.
- Do not redesign unrelated components.
- Keep admin UI visually consistent with the existing theme.
- Use `DataGridComponent`/AG Grid global styles for tables.
- Do not add new global tokens unless explicitly asked or a broad repeated styling need exists.

## Examples

Bad:

```scss
.card-title {
  font-size: 24px;
  color: #123456;
  border-radius: 18px;
}
```

Good:

```scss
.card-title {
  font-size: var(--font-size-h4);
  color: var(--font-main);
  border-radius: var(--radius-lg);
}
```

Current-state note: typography tokens are present, but not every component uses them yet. Prefer existing tokens for new styling and keep color/radius/shadow values tokenized where possible.
