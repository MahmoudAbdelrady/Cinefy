import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../../services';

// Auth endpoints must not trigger refresh-retry.
const EXCLUDED_AUTH_PATHS = [
  '/management/auth/login',
  '/management/auth/refresh',
  '/management/auth/session',
];

export const authRetryInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = EXCLUDED_AUTH_PATHS.some((path) => req.url.includes(path));
      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      // Access token likely expired: refresh then replay.
      return authService.refresh().pipe(
        switchMap(() => next(req)),
        catchError(() => {
          authService.clearAuthState();
          router.navigateByUrl('/login');
          return throwError(() => error);
        }),
      );
    }),
  );
};
