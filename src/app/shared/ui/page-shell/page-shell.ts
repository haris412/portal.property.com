import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  templateUrl: './page-shell.html',
  styleUrl: './page-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageShellComponent {}