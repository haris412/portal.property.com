import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> };
  let mockAuth: {
    hasStoredRefreshToken: ReturnType<typeof vi.fn>;
    isLoggedIn: ReturnType<typeof vi.fn>;
    tryRestoreSession: ReturnType<typeof vi.fn>;
  };

  async function runGuard(): Promise<ReturnType<typeof authGuard>> {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
  }

  beforeEach(() => {
    mockRouter = {
      createUrlTree: vi.fn().mockReturnValue({ urlTree: true }),
      navigate: vi.fn(),
    };
    mockAuth = {
      hasStoredRefreshToken: vi.fn().mockReturnValue(true),
      isLoggedIn: vi.fn().mockReturnValue(true),
      tryRestoreSession: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when refresh token exists and session is active', async () => {
    const result = await runGuard();
    expect(result).toBe(true);
  });

  it('should redirect when no refresh token in localStorage', async () => {
    mockAuth.hasStoredRefreshToken.mockReturnValue(false);
    const result = await runGuard();
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth']);
    expect(result).toBeTruthy();
    expect(result).not.toBe(true);
  });

  it('should redirect when session restore fails', async () => {
    mockAuth.isLoggedIn.mockReturnValue(false);
    const result = await runGuard();
    expect(mockAuth.tryRestoreSession).toHaveBeenCalled();
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth']);
    expect(result).not.toBe(true);
  });
});
