import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData } from '../../models/stats.model';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-widget">
      <div class="widget-header">
        <div>
          <h3 class="widget-title">{{ title }}</h3>
          <p class="widget-subtitle">{{ subtitle }}</p>
        </div>
        <div class="chart-legend">
          <span *ngFor="let ds of data.datasets" class="legend-item">
            <span class="legend-dot" [style.background]="ds.color"></span>
            {{ ds.label }}
          </span>
        </div>
      </div>

      <!-- Simple SVG bar chart -->
      <div class="chart-area">
        <svg #chartSvg class="chart-svg" viewBox="0 0 700 200" preserveAspectRatio="none">
          <!-- Grid lines -->
          <line *ngFor="let y of gridLines" [attr.x1]="40" [attr.y1]="y" [attr.x2]="690" [attr.y2]="y"
            stroke="var(--border-field)" stroke-width="1"/>

          <!-- Bars -->
          <g *ngFor="let label of data.labels; let i = index">
            <rect
              *ngFor="let ds of data.datasets; let di = index"
              [attr.x]="getBarX(i, di)"
              [attr.y]="getBarY(ds.data[i])"
              [attr.width]="barWidth"
              [attr.height]="getBarHeight(ds.data[i])"
              [attr.fill]="ds.color"
              [attr.opacity]="di === 0 ? 1 : 0.6"
              rx="3"
            />
          </g>

          <!-- X labels -->
          <text
            *ngFor="let label of data.labels; let i = index"
            [attr.x]="getLabelX(i)"
            y="198"
            text-anchor="middle"
            font-size="10"
            fill="var(--font-secondary)"
          >{{ label }}</text>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .chart-widget {
      background: var(--surface);
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid var(--border-soft);
    }
    .widget-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      gap: 1rem;
    }
    .widget-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--font-main);
      margin: 0 0 0.25rem;
    }
    .widget-subtitle {
      font-size: 0.8125rem;
      color: var(--font-secondary);
      margin: 0;
    }
    .chart-legend {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--font-secondary);
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .chart-area {
      position: relative;
      height: 200px;
    }
    .chart-svg {
      width: 100%;
      height: 100%;
    }
  `],
})
export class ChartWidgetComponent implements OnInit {
  @Input({ required: true }) data!: ChartData;
  @Input() title = 'Revenue Overview';
  @Input() subtitle = 'Monthly revenue and expenses';

  chartHeight = 180;
  barWidth = 18;
  barGap = 4;
  groupGap = 20;
  startX = 50;
  gridLines: number[] = [];

  ngOnInit(): void {
    this.gridLines = [20, 60, 100, 140, 180];
  }

  private getMaxValue(): number {
    const allValues = this.data.datasets.flatMap((ds) => ds.data);
    return Math.max(...allValues);
  }

  getBarHeight(value: number): number {
    return (value / this.getMaxValue()) * this.chartHeight;
  }

  getBarY(value: number): number {
    return this.chartHeight - this.getBarHeight(value) + 10;
  }

  getBarX(index: number, datasetIndex: number): number {
    const groupWidth = this.data.datasets.length * (this.barWidth + this.barGap) + this.groupGap;
    return this.startX + index * groupWidth + datasetIndex * (this.barWidth + this.barGap);
  }

  getLabelX(index: number): number {
    const groupWidth = this.data.datasets.length * (this.barWidth + this.barGap) + this.groupGap;
    return this.startX + index * groupWidth + (this.data.datasets.length * (this.barWidth + this.barGap)) / 2;
  }
}