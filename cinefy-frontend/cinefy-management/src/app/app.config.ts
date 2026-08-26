import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  baseUrlInterceptor,
  csrfInterceptor,
  authRetryInterceptor,
  errorToastInterceptor,
} from './core/interceptors';
import { provideMenuConfig } from 'ng-primitives/menu';
import { provideCinefyToast } from 'cinefy-ui/services';
import { providePrimeNG } from 'primeng/config';
import { CinefyPreset } from './cinefy-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        baseUrlInterceptor,
        csrfInterceptor,
        authRetryInterceptor,
        errorToastInterceptor,
      ]),
    ),
    provideCinefyToast(),
    provideMenuConfig({ scrollBehavior: 'reposition' }),
    providePrimeNG({
      theme: {
        preset: CinefyPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
  ],
};
