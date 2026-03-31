import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { SERVER_ERROR_KEY } from './parse-http-api-error';

const wiredClear = new WeakSet<AbstractControl>();

function wireClearServerError(control: AbstractControl, destroyRef: DestroyRef): void {
  if (wiredClear.has(control)) {
    return;
  }
  wiredClear.add(control);
  control.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
    if (!control.hasError(SERVER_ERROR_KEY)) {
      return;
    }
    const err = control.errors;
    if (!err) {
      return;
    }
    const next: ValidationErrors = { ...err };
    delete next[SERVER_ERROR_KEY];
    control.setErrors(Object.keys(next).length ? next : null);
  });
}

export type ApiPathToControlMap = Readonly<Record<string, string>>;

/**
 * Applies backend `path` → message onto the right `FormGroup` controls.
 * Merges with existing validator errors; clears the server key when the user edits the field.
 */
export function applyServerFieldErrors(
  fieldErrors: Record<string, string>,
  groups: ReadonlyArray<{ form: FormGroup; map: ApiPathToControlMap }>,
  destroyRef: DestroyRef
): void {
  for (const [apiPath, msg] of Object.entries(fieldErrors)) {
    if (!msg) continue;
    const normalizedPath = apiPath.trim();
    for (const { form, map } of groups) {
      const controlName =
        map[normalizedPath] ?? map[stripExpressIndexSegment(normalizedPath)];
      if (!controlName) {
        continue;
      }
      const control = form.get(controlName);
      if (!control) {
        continue;
      }
      const merged: ValidationErrors = { ...(control.errors ?? {}), [SERVER_ERROR_KEY]: msg };
      control.setErrors(merged);
      control.markAsTouched();
      wireClearServerError(control, destroyRef);
    }
  }
}

/** `images[0].url` → `images.url` (best-effort fallback for map keys). */
function stripExpressIndexSegment(path: string): string {
  return path.replace(/\[\d+]/g, '');
}
