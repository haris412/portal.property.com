import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService, LoginCredentials } from './auth.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: { navigate: ReturnType<typeof vi.fn>; createUrlTree: ReturnType<typeof vi.fn> };

  const mockUser: User = {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    createdAt: '2024-01-01',
    isActive: true,
  };

  beforeEach(() => {
    mockRouter = { navigate: vi.fn(), createUrlTree: vi.fn().mockReturnValue({}) };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: mockRouter }],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with unauthenticated state', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('should authenticate on successful login', () => {
    const credentials: LoginCredentials = { email: 'alice@example.com', password: 'password123' };
    const mockToken = 'mock-jwt-token';

    service.login(credentials).subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);

    req.flush({
      success: true,
      message: 'Login successful',
      statusCode: 200,
      data: { user: mockUser, token: mockToken },
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.token()).toBe(mockToken);
  });

  it('should persist auth state in localStorage after login', () => {
    const credentials: LoginCredentials = { email: 'alice@example.com', password: 'pass' };

    service.login(credentials).subscribe();

    httpMock.expectOne('/api/auth/login').flush({
      success: true,
      message: 'OK',
      statusCode: 200,
      data: { user: mockUser, token: 'test-token' },
    });

    expect(localStorage.getItem('auth_token')).toBe('test-token');
    expect(JSON.parse(localStorage.getItem('auth_user')!)).toEqual(mockUser);
  });

  it('should clear state and redirect on logout', () => {
    localStorage.setItem('auth_token', 'old-token');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should restore state from localStorage on init', () => {
    // Set localStorage BEFORE injecting so the service constructor reads it
    localStorage.setItem('auth_token', 'saved-token');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    // Create a new TestBed environment so the service is freshly instantiated
    TestBed.resetTestingModule();
    const routerMock = { navigate: vi.fn(), createUrlTree: vi.fn().mockReturnValue({}) };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerMock }],
    });

    const freshService = TestBed.inject(AuthService);
    expect(freshService.isAuthenticated()).toBe(true);
    expect(freshService.token()).toBe('saved-token');
  });
});
