import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { baseUrlInterceptor, csrfInterceptor, authRetryInterceptor } from './core/interceptors';
import { provideToastConfig } from 'ng-primitives/toast';
import { provideMenuConfig } from 'ng-primitives/menu';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([baseUrlInterceptor, csrfInterceptor, authRetryInterceptor]),
    ),
    provideToastConfig({
      placement: 'top-center',
      duration: 4000,
      offsetBottom: 24,
      offsetRight: 24,
      dismissible: true,
      maxToasts: 5,
      gap: 8,
      zIndex: 9999,
    }),
    provideMenuConfig({ scrollBehavior: 'reposition' }),
  ],
};
