import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../core/services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockAuthService: { logout: ReturnType<typeof vi.fn>; currentUser: any; isAuthenticated: any; token: any };

  beforeEach(async () => {
    mockAuthService = {
      logout: vi.fn(),
      currentUser: signal({ id: 1, name: 'Alice Johnson', email: 'alice@test.com', role: 'admin', createdAt: '', isActive: true }),
      isAuthenticated: signal(true),
      token: signal('mock-token'),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterModule.forRoot([])],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render page title', () => {
    fixture.componentRef.setInput('pageTitle', 'My Page');
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.page-title');
    expect(title.textContent.trim()).toBe('My Page');
  });

  it('should emit menuToggle on button click', () => {
    const emitSpy = vi.spyOn(component.menuToggle, 'emit');
    const btn = fixture.nativeElement.querySelector('.menu-toggle');
    btn.click();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should compute correct user initials', () => {
    expect(component.userInitials).toBe('AJ');
  });

  it('should toggle user menu visibility', () => {
    expect(component.userMenuOpen).toBe(false);
    component.toggleUserMenu();
    expect(component.userMenuOpen).toBe(true);
    component.toggleUserMenu();
    expect(component.userMenuOpen).toBe(false);
  });

  it('should call logout and close menu on logout()', () => {
    component.userMenuOpen = true;
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(component.userMenuOpen).toBe(false);
  });

  it('should display notification badge', () => {
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('3');
  });

  it('should display search input', () => {
    const input = fixture.nativeElement.querySelector('.search-input');
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Search...');
  });
});
