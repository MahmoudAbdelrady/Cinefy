import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  baseUrlInterceptor,
  csrfInterceptor,
  authRetryInterceptor,
  errorToastInterceptor,
  networkErrorInterceptor,
} from './core/interceptors';
import { provideCinefyToast } from 'cinefy-ui/services';
import { providePrimeNG } from 'primeng/config';
import { CinefyClientPreset } from './cinefy-client-preset';
import environment from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,
        csrfInterceptor,
        authRetryInterceptor,
        errorToastInterceptor,
        networkErrorInterceptor,
      ]),
    ),
    provideCinefyToast(),
    providePrimeNG({
      license: environment.primeuiLicenseKey,
      inputVariant: 'filled',
      theme: {
        preset: CinefyClientPreset,
      },
    }),
  ],
};
