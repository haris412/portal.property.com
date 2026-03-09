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
      background: #ffffff;
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
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
      color: #0f172a;
      margin: 0;
    }
    .view-all-btn {
      background: transparent;
      border: none;
      color: #6366f1;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      &:hover { background: #eef2ff; }
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
      color: white;
      flex-shrink: 0;
      &.avatar-create  { background: linear-gradient(135deg, #6366f1, #818cf8); }
      &.avatar-update  { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
      &.avatar-delete  { background: linear-gradient(135deg, #ef4444, #f87171); }
      &.avatar-login   { background: linear-gradient(135deg, #10b981, #34d399); }
    }
    .activity-content {
      flex: 1;
      min-width: 0;
    }
    .activity-text {
      font-size: 0.8125rem;
      color: #374151;
      margin: 0 0 0.15rem;
      line-height: 1.4;
    }
    .activity-target {
      color: #6366f1;
      font-style: italic;
    }
    .activity-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .activity-type-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      &.badge-create  { background: #eef2ff; color: #6366f1; }
      &.badge-update  { background: #fffbeb; color: #d97706; }
      &.badge-delete  { background: #fef2f2; color: #dc2626; }
      &.badge-login   { background: #ecfdf5; color: #059669; }
    }
  `],
})
export class RecentActivityComponent {
  @Input({ required: true }) activities!: ActivityItem[];
}
