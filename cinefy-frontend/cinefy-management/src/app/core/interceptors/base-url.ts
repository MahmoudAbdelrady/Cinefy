import { HttpInterceptorFn } from '@angular/common/http';
import environment from '../../../environments/environment';

const AUTH_CONTEXT_HEADER = 'X-Auth-Context';
const AUTH_CONTEXT = 'management';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  return next(
    req.clone({
      url: `${environment.apiUrl}${req.url}`,
      withCredentials: true,
      headers: req.headers.set(AUTH_CONTEXT_HEADER, AUTH_CONTEXT),
    }),
  );
};
