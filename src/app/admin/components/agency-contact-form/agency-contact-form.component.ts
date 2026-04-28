import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-agency-contact-form',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './agency-contact-form.component.html',
  styleUrl: './agency-contact-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgencyContactFormComponent {
  @Input({ required: true }) contact!: FormGroup;
  @Input() canBePrimary = true;
  @Input() canRemove = true;
  @Input() isPrimary = false;

  @Output() readonly primaryChange = new EventEmitter<void>();
  @Output() readonly remove = new EventEmitter<void>();

  get nameControl(): FormControl { return this.contact.get('name') as FormControl; }
  get emailControl(): FormControl { return this.contact.get('email') as FormControl; }
  get phoneControl(): FormControl { return this.contact.get('phone') as FormControl; }

  get contactInitials(): string {
    const name = (this.nameControl?.value as string)?.trim() ?? '';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'C';
  }

  makePrimary(): void {
    if (this.canBePrimary && !this.isPrimary) {
      this.primaryChange.emit();
    }
  }

  onRemove(): void {
    if (this.canRemove) {
      this.remove.emit();
    }
  }
}
