import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  input
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import * as echarts from 'echarts';
import type { EChartsOption, EChartsType } from 'echarts';

import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';

@Component({
  selector: 'app-chart-panel',
  standalone: true,
  imports: [SectionCardComponent],
  templateUrl: './chart-panel.html',
  styleUrl: './chart-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartPanelComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly options = input.required<EChartsOption>();
  readonly height = input<string>('320px');

  @ViewChild('chartEl') private chartEl?: ElementRef<HTMLElement>;

  private chart?: EChartsType;
  private resizeObs?: ResizeObserver;

  @HostBinding('class.chart-panel-host') protected hostClass = true;

  constructor() {
    // When options change, update the chart
    effect(() => {
      const opt = this.options();
      if (!this.chart) return;
      this.chart.setOption(opt, { notMerge: true });
    });

    // When height changes, apply it and resize
    effect(() => {
      const h = this.height();
      const el = this.chartEl?.nativeElement;
      if (el) el.style.height = h;
      queueMicrotask(() => this.chart?.resize());
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.chartEl?.nativeElement;
    if (!el) return;

    el.style.height = this.height();

    this.chart = echarts.init(el, undefined, { renderer: 'canvas' });
    this.chart.setOption(this.options(), { notMerge: true });

    this.resizeObs = new ResizeObserver(() => this.chart?.resize());
    this.resizeObs.observe(el);
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    this.chart?.dispose();
  }
}