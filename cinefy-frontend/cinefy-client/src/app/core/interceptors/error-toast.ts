import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs';
import { CinefyToastService } from 'cinefy-ui/services';
import { SKIP_ERROR_TOAST } from './error-toast-context';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(CinefyToastService);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  return next(req).pipe(
    tap({
      error: (error: HttpErrorResponse) => {
        if (!isBrowser) return;
        if (req.context.get(SKIP_ERROR_TOAST)) return;
        if (error.status === 401) return;
        toastService.error(error.error?.message ?? DEFAULT_ERROR_MESSAGE);
      },
    }),
  );
};
