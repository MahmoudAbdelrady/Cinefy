import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../../services';

// Auth endpoints must not trigger refresh-retry.
const EXCLUDED_AUTH_PATHS = [
  '/clients/auth/login',
  '/clients/auth/refresh',
  '/clients/auth/session',
];

export const authRetryInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = EXCLUDED_AUTH_PATHS.some((path) => req.url.includes(path));
      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        switchMap(() => next(req)),
        catchError(() => {
          authService.clearAuthState();
          return throwError(() => error);
        }),
      );
    }),
  );
};
