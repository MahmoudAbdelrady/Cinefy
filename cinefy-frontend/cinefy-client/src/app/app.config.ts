import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  baseUrlInterceptor,
  csrfInterceptor,
  authRetryInterceptor,
  errorToastInterceptor,
} from './core/interceptors';
import { provideCinefyToast } from 'cinefy-ui/services';
import { provideMenuConfig } from 'ng-primitives/menu';
import { providePrimeNG } from 'primeng/config';
import { CinefyClientPreset } from './cinefy-client-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
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
        preset: CinefyClientPreset,
      },
    }),
  ],
};
