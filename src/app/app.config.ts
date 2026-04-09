import {
  ApplicationConfig,
  APP_INITIALIZER,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogModule } from '@angular/material/dialog';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { routes } from './app.routes';

ModuleRegistry.registerModules([AllCommunityModule]);
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { AdminAuthService } from './core/services/admin-auth.service';

export function restoreSessionFactory(auth: AuthService, adminAuth: AdminAuthService) {
  return () => Promise.all([auth.tryRestoreSession(), adminAuth.tryRestoreSession()]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    importProvidersFrom(MatDialogModule),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: restoreSessionFactory,
      deps: [AuthService, AdminAuthService],
      multi: true,
    },
  ],
};
