import { HttpInterceptorFn } from '@angular/common/http';
import environment from '../../../environments/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  return next(req.clone({ url: `${environment.apiUrl}${req.url}` }));
};
