import { Injectable, signal } from '@angular/core';

/**
 * Holds email and reset token in memory only for the forgot-password wizard.
 * Cleared on completion or when the user opens the first step again.
 *
 * Exposes readonly signals so templates and `computed()` track dependencies explicitly.
 */
@Injectable({
  providedIn: 'root'
})
export class PasswordResetFlowService {
  private readonly emailWritable = signal<string | null>(null);
  private readonly resetTokenWritable = signal<string | null>(null);

  readonly email = this.emailWritable.asReadonly();
  readonly resetToken = this.resetTokenWritable.asReadonly();

  setEmail(value: string): void {
    this.emailWritable.set(value.trim());
  }

  setResetToken(token: string): void {
    this.resetTokenWritable.set(token);
  }

  clear(): void {
    this.emailWritable.set(null);
    this.resetTokenWritable.set(null);
  }
}
