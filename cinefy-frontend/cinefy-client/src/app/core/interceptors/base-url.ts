import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import environment from '../../../environments/environment';

const AUTH_CONTEXT_HEADER = 'X-Auth-Context';
const AUTH_CONTEXT = 'client';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  let base = environment.apiUrl;

  if (isPlatformServer(inject(PLATFORM_ID)) && !base.startsWith('http')) {
    const serverOrigin = process.env['API_ORIGIN'] ?? 'http://localhost:8080';
    base = `${serverOrigin}${base}`;
  }

  return next(
    req.clone({
      url: `${base}${req.url}`,
      withCredentials: true,
      headers: req.headers.set(AUTH_CONTEXT_HEADER, AUTH_CONTEXT),
    }),
  );
};
