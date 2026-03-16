import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> };

  function runGuard(): ReturnType<typeof authGuard> {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
  }

  beforeEach(() => {
    mockRouter = {
      createUrlTree: vi.fn().mockReturnValue({ urlTree: true }),
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => true } },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when authenticated', () => {
    TestBed.overrideProvider(AuthService, { useValue: { isLoggedIn: () => true } });
    const result = runGuard();
    expect(result).toBe(true);
  });

  it('should redirect when not authenticated', () => {
    TestBed.overrideProvider(AuthService, { useValue: { isLoggedIn: () => false } });
    const result = runGuard();
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth']);
    expect(result).toBeTruthy();
    expect(result).not.toBe(true);
  });
});
