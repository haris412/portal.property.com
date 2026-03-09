import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCard } from '../../models/stats.model';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card" [class]="'card-' + card.color">
      <div class="card-header">
        <div class="card-icon" [class]="'icon-' + card.color">
          <svg *ngIf="card.icon === 'revenue'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2v18M7 6h7a2 2 0 010 4H8a2 2 0 000 4h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <svg *ngIf="card.icon === 'users'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5 19a6 6 0 0112 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <svg *ngIf="card.icon === 'orders'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 5h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg *ngIf="card.icon === 'conversion'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 17l5-5 4 4 7-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="card-title">{{ card.title }}</p>
      </div>

      <div class="card-body">
        <p class="card-value">{{ card.value }}</p>
        <div class="card-change" [class.positive]="card.change > 0" [class.negative]="card.change < 0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              [attr.d]="card.change >= 0 ? 'M7 10V4M4 7l3-3 3 3' : 'M7 4v6M4 7l3 3 3-3'"
              stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
            />
          </svg>
          <span>{{ card.change > 0 ? '+' : '' }}{{ card.change }}%</span>
          <span class="change-label">{{ card.changeLabel }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      background: #ffffff;
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      transition: box-shadow 0.2s, transform 0.2s;
      &:hover {
        box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        transform: translateY(-2px);
      }
    }
    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .card-icon {
      width: 44px;
      height: 44px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-indigo  { background: #eef2ff; color: #6366f1; }
    .icon-emerald { background: #ecfdf5; color: #10b981; }
    .icon-amber   { background: #fffbeb; color: #f59e0b; }
    .icon-rose    { background: #fff1f2; color: #f43f5e; }

    .card-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      margin: 0;
      padding-top: 0.2rem;
    }
    .card-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem;
      line-height: 1.2;
    }
    .card-change {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #94a3b8;
      &.positive { color: #10b981; }
      &.negative { color: #ef4444; }
    }
    .change-label {
      font-weight: 400;
      color: #94a3b8;
    }
  `],
})
export class StatsCardComponent {
  @Input({ required: true }) card!: StatCard;
}
