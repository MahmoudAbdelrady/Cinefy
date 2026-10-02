import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

const SERVER_UNREACHABLE_MESSAGE = 'Could not reach the server. Please try again later.';

const UNREACHABLE_STATUSES = new Set<number>([
  0,
  HttpStatusCode.BadGateway,
  HttpStatusCode.ServiceUnavailable,
  HttpStatusCode.GatewayTimeout,
]);

export const networkErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!UNREACHABLE_STATUSES.has(error.status)) return throwError(() => error);

      return throwError(
        () =>
          new HttpErrorResponse({
            error: { message: SERVER_UNREACHABLE_MESSAGE },
            headers: error.headers,
            status: error.status,
            url: error.url ?? undefined,
          }),
      );
    }),
  );
