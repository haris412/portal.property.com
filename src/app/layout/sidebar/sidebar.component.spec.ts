import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { vi } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render brand name', () => {
    const el = fixture.nativeElement.querySelector('.brand-name');
    expect(el).toBeTruthy();
    expect(el.textContent.trim()).toBe('Portal');
  });

  it('should render all nav items', () => {
    const items = fixture.nativeElement.querySelectorAll('.nav-item');
    expect(items.length).toBe(component.navItems.length);
  });

  it('should start expanded (not collapsed)', () => {
    expect(component.collapsed).toBe(false);
    const sidebar = fixture.nativeElement.querySelector('.sidebar');
    expect(sidebar.classList).not.toContain('collapsed');
  });

  it('should toggle collapse on button click', () => {
    const btn = fixture.nativeElement.querySelector('.collapse-btn');
    btn.click();
    fixture.detectChanges();

    expect(component.collapsed).toBe(true);
    const sidebar = fixture.nativeElement.querySelector('.sidebar');
    expect(sidebar.classList).toContain('collapsed');
  });

  it('should emit collapsedChange when toggling', () => {
    const emitSpy = vi.spyOn(component.collapsedChange, 'emit');

    component.toggleCollapse();

    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  it('should hide brand name when collapsed', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const brandName = fixture.nativeElement.querySelector('.brand-name');
    expect(brandName).toBeNull();
  });

  it('should have 4 nav items defined', () => {
    expect(component.navItems.length).toBe(4);
  });

  it('should have dashboard as first nav item', () => {
    expect(component.navItems[0].label).toBe('Dashboard');
    expect(component.navItems[0].route).toBe('/dashboard');
  });
});
