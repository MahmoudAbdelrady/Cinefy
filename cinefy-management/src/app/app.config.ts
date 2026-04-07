import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { baseUrlInterceptor } from './core/interceptors/base-url';
import { provideToastConfig } from 'ng-primitives/toast';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([baseUrlInterceptor])),
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
  ],
};
