import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityItem } from '../../models/stats.model';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, TruncatePipe],
  template: `
    <div class="activity-widget">
      <div class="widget-header">
        <h3 class="widget-title">Recent Activity</h3>
        <button class="view-all-btn">View all</button>
      </div>

      <ul class="activity-list">
        <li class="activity-item" *ngFor="let item of activities">
          <div class="activity-avatar" [class]="'avatar-' + item.type">
            {{ item.avatar }}
          </div>
          <div class="activity-content">
            <p class="activity-text">
              <strong>{{ item.user }}</strong>
              {{ item.action }}
              <span *ngIf="item.target" class="activity-target">{{ item.target | truncate:30 }}</span>
            </p>
            <span class="activity-time">{{ item.timestamp }}</span>
          </div>
          <div class="activity-type-badge" [class]="'badge-' + item.type">
            {{ item.type }}
          </div>
        </li>
      </ul>
    </div>
  `,
  styles: [`
  .activity-widget {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: 1.25rem;
    border: 1px solid var(--border-soft);
    height: 100%;
  }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .widget-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--font-main);
    margin: 0;
  }

  .view-all-btn {
    background: transparent;
    border: none;
    color: var(--primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);

    &:hover {
      background: color-mix(in srgb, var(--primary) 10%, var(--surface));
    }
  }

  .activity-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .activity-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--surface);
    flex-shrink: 0;

    &.avatar-create  { background: linear-gradient(135deg, var(--primary), var(--badge-accent-purple)); }
    &.avatar-update  { background: linear-gradient(135deg, var(--warning), color-mix(in srgb, var(--warning) 70%, var(--surface))); }
    &.avatar-delete  { background: linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 70%, var(--surface))); }
    &.avatar-login   { background: linear-gradient(135deg, var(--success), var(--badge-accent-teal)); }
  }

  .activity-content {
    flex: 1;
    min-width: 0;
  }

  .activity-text {
    font-size: 0.8125rem;
    color: var(--font-main);
    margin: 0 0 0.15rem;
    line-height: 1.4;
  }

  .activity-target {
    color: var(--primary);
    font-style: italic;
  }

  .activity-time {
    font-size: 0.75rem;
    color: var(--font-secondary);
  }

  .activity-type-badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-pill);
    text-transform: uppercase;
    letter-spacing: 0.04em;

    &.badge-create  { background: color-mix(in srgb, var(--primary) 10%, var(--surface)); color: var(--primary); }
    &.badge-update  { background: color-mix(in srgb, var(--warning) 12%, var(--surface)); color: color-mix(in srgb, var(--warning) 70%, var(--font-main)); }
    &.badge-delete  { background: color-mix(in srgb, var(--error) 10%, var(--surface)); color: var(--error); }
    &.badge-login   { background: color-mix(in srgb, var(--success) 10%, var(--surface)); color: var(--success); }
  }
`],
})
export class RecentActivityComponent {
  @Input({ required: true }) activities!: ActivityItem[];
}
