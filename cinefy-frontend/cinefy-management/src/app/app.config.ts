import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { baseUrlInterceptor, csrfInterceptor, authRetryInterceptor } from './core/interceptors';
import { provideMenuConfig } from 'ng-primitives/menu';
import { provideCinefyToast } from 'cinefy-ui/services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([baseUrlInterceptor, csrfInterceptor, authRetryInterceptor]),
    ),
    provideCinefyToast(),
    provideMenuConfig({ scrollBehavior: 'reposition' }),
  ],
};
