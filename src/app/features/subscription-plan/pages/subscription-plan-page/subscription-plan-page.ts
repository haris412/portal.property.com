import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { SubscriptionConfigService } from '../../../../core/services/subscription-config.service';
import { NotificationService } from '../../../../core/services/notification.service';
import type { Role, RoleListItem } from '../../../../core/models/role.models';
import type {
  SubscriptionConfig,
  SubscriptionConfigBulkPayload,
  SubscriptionConfigListDto,
  SubscriptionFeatures,
  SubscriptionFeaturesListDto,
} from '../../../../core/interfaces/subscription.models';
import type { ResponseModel } from '../../../../core/models/response.model';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';

/** One editable subscription config row (reactive forms). */
export type SubscriptionConfigRowFormGroup = FormGroup<{
  rowKey: FormControl<string>;
  configId: FormControl<string | null>;
  featureId: FormControl<string>;
  monthlyPrice: FormControl<number>;
  annualPrice: FormControl<number>;
  featureValue: FormControl<number>;
}>;

@Component({
  selector: 'app-subscription-plan-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, SectionCardComponent],
  templateUrl: './subscription-plan-page.html',
  styleUrl: './subscription-plan-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPlanPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly subscriptionApi = inject(SubscriptionConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly planForm = this.fb.group({
    roleName: this.fb.nonNullable.control(''),
    configRows: this.fb.array<SubscriptionConfigRowFormGroup>([]),
  });

  readonly roles = signal<RoleListItem[]>([]);
  readonly features = signal<SubscriptionFeatures[]>([]);

  loadingRoles = signal(false);
  loadingFeatures = signal(false);
  loadingConfigs = signal(false);
  saving = signal(false);
  loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRoles();
    this.loadFeatures();
  }

  get configRows(): FormArray<SubscriptionConfigRowFormGroup> {
    return this.planForm.controls.configRows;
  }

  private featureIdForForm(config?: SubscriptionConfigListDto): string {
    const ref = config?.feature;
    if (ref == null) {
      return '';
    }
    if (typeof ref === 'string') {
      return ref;
    }
    return ref._id ?? '';
  }

  private createConfigRowGroup(config?: SubscriptionConfigListDto): SubscriptionConfigRowFormGroup {
    const rowKey = crypto.randomUUID() as string;
    return this.fb.group({
      rowKey: this.fb.nonNullable.control(rowKey),
      configId: this.fb.control<string | null>(config?._id ?? null),
      featureId: this.fb.nonNullable.control(this.featureIdForForm(config), {
        validators: [Validators.required],
      }),
      monthlyPrice: this.fb.nonNullable.control(config?.monthlyPrice ?? 0, {
        validators: [Validators.required, Validators.min(0)],
      }),
      annualPrice: this.fb.nonNullable.control(config?.annualPrice ?? 0, {
        validators: [Validators.required, Validators.min(0)],
      }),
      featureValue: this.fb.nonNullable.control(config?.featureValue ?? 0, {
        validators: [Validators.required, Validators.min(0)],
      }),
    });
  }

  private loadRoles(): void {
    this.loadingRoles.set(true);
    this.loadError.set(null);
    this.subscriptionApi.getAllRoles().subscribe({
      next: (res: ResponseModel<Role>) => {
        const list = Array.isArray(res.data.roles) ? res.data.roles : [];
        this.roles.set(list);
        if (list.length > 0 && !this.planForm.controls.roleName.value) {
          const first = String(list[0].name ?? '');
          this.planForm.controls.roleName.setValue(first);
          this.loadConfigsForRole(first);
        }
        this.loadingRoles.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingRoles.set(false);
        this.loadError.set('Could not load roles.');
        this.notifications.error('Could not load roles.');
        this.cdr.markForCheck();
      },
    });
  }

  private loadFeatures(): void {
    this.loadingFeatures.set(true);
    this.subscriptionApi.getAllSubscriptionFeatures().subscribe({
      next: (res: ResponseModel<SubscriptionFeaturesListDto>) => {
        const list = Array.isArray(res.data.subscriptionFeatures)
          ? res.data.subscriptionFeatures
          : [];
        this.features.set(list);
        this.loadingFeatures.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingFeatures.set(false);
        this.notifications.error('Could not load subscription features.');
        this.cdr.markForCheck();
      },
    });
  }

  onRoleSelected(): void {
    const role = this.planForm.controls.roleName.value.trim();
    if (role) {
      this.loadConfigsForRole(role);
    } else {
      this.configRows.clear();
    }
    this.cdr.markForCheck();
  }

  private loadConfigsForRole(roleName: string): void {
    this.loadingConfigs.set(true);
    this.loadError.set(null);
    this.subscriptionApi.getSubscriptionConfigByRole(roleName).subscribe({
      next: (res: ResponseModel<SubscriptionConfig>) => {
        this.loadError.set(null);
        const configs = res.data.subscriptionConfigs ?? [];
        this.configRows.clear();
        for (const c of configs) {
          this.configRows.push(this.createConfigRowGroup(c));
        }
        this.loadingConfigs.set(false);
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.loadingConfigs.set(false);
        this.configRows.clear();
        const summary = apiErrorSummary(err);
        this.loadError.set(summary);
        this.notifications.error(summary);
        this.cdr.markForCheck();
      },
    });
  }

  addRow(): void {
    const role = this.planForm.controls.roleName.value.trim();
    if (!role) {
      this.notifications.warning('Select a role first.');
      return;
    }
    const fs = this.features();
    const group = this.createConfigRowGroup(undefined);
    if (fs.length > 0) {
      group.controls.featureId.setValue(fs[0]._id);
    }
    this.configRows.push(group);
    this.cdr.markForCheck();
  }

  removeRow(index: number): void {
    this.configRows.removeAt(index);
    this.cdr.markForCheck();
  }

  save(): void {
    const role = this.planForm.controls.roleName.value.trim();
    if (!role) {
      this.notifications.warning('Select a role.');
      return;
    }

    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      this.notifications.error('Fix validation errors before saving.');
      return;
    }

    const featureIds = new Set<string>();
    const payloadItems: SubscriptionConfigBulkPayload['subscriptionConfigs'] = [];

    for (let i = 0; i < this.configRows.length; i++) {
      const g = this.configRows.at(i);
      const v = g.getRawValue();
      const fid = v.featureId.trim();
      if (!fid) {
        this.notifications.error('Each row must have a feature selected.');
        return;
      }
      if (featureIds.has(fid)) {
        this.notifications.error(
          'Duplicate feature for this role. Remove or change one of the rows.'
        );
        return;
      }
      featureIds.add(fid);

      payloadItems.push({
        ...(v.configId ? { _id: v.configId } : {}),
        role,
        featureId: fid,
        monthlyPrice: v.monthlyPrice,
        annualPrice: v.annualPrice,
        featureValue: v.featureValue,
      });
    }

    const body: SubscriptionConfigBulkPayload = { subscriptionConfigs: payloadItems };

    this.saving.set(true);
    this.subscriptionApi.bulkSave(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success('Subscription configuration saved.');
        this.loadConfigsForRole(role);
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        this.notifications.error('Save failed. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  trackRowGroup(_index: number, group: AbstractControl): string {
    const fg = group as SubscriptionConfigRowFormGroup;
    return fg.controls.rowKey.value;
  }
}
