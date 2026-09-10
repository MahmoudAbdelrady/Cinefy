import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  baseUrlInterceptor,
  csrfInterceptor,
  authRetryInterceptor,
  errorToastInterceptor,
} from './core/interceptors';
import { provideCinefyToast } from 'cinefy-ui/services';
import { providePrimeNG } from 'primeng/config';
import { CinefyPreset } from './cinefy-preset';
import environment from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,
        csrfInterceptor,
        authRetryInterceptor,
        errorToastInterceptor,
      ]),
    ),
    provideCinefyToast(),
    providePrimeNG({
      license: environment.primeuiLicenseKey,
      theme: {
        preset: CinefyPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
  ],
};
