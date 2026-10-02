import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { CinefyToastService } from 'cinefy-ui/services';
import { SKIP_ERROR_TOAST, SKIP_SERVER_ERROR_TOAST } from './error-toast-context';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(CinefyToastService);

  return next(req).pipe(
    tap({
      error: (error: HttpErrorResponse) => {
        if (req.context.get(SKIP_ERROR_TOAST)) return;
        if (req.context.get(SKIP_SERVER_ERROR_TOAST) && (error.status === 0 || error.status >= 500))
          return;
        if (error.status === 401) return;
        toastService.error(error.error?.message ?? DEFAULT_ERROR_MESSAGE);
      },
    }),
  );
};
