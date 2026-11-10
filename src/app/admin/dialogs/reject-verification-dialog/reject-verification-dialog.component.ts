import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-reject-verification-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
  ],
  templateUrl: './reject-verification-dialog.component.html',
  styleUrl: './reject-verification-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectVerificationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RejectVerificationDialogComponent, string | undefined>);

  readonly reason = signal('');

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    const value = this.reason().trim();
    if (!value) return;
    this.dialogRef.close(value);
  }
}
