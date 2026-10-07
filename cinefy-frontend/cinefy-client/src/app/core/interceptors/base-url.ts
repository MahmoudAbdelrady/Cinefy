import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { tap } from 'rxjs';
import environment from '../../../environments/environment';

const AUTH_CONTEXT_HEADER = 'X-Auth-Context';
const AUTH_CONTEXT = 'client';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const isServer = isPlatformServer(inject(PLATFORM_ID));
  let base = environment.apiUrl;

  if (isServer && !base.startsWith('http')) {
    const serverOrigin = process.env['API_ORIGIN'] ?? 'http://localhost:8080';
    base = `${serverOrigin}${base}`;
  }

  const request = req.clone({
    url: `${base}${req.url}`,
    withCredentials: true,
    headers: req.headers.set(AUTH_CONTEXT_HEADER, AUTH_CONTEXT),
  });

  if (!isServer) {
    return next(request);
  }

  const headers = Object.fromEntries(
    request.headers.keys().map((key) => [key, request.headers.get(key)]),
  );
  console.log(`[SSR api] → ${request.method} ${request.urlWithParams}`, headers);

  return next(request).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log(`[SSR api] ← ${event.status} ${request.method} ${request.urlWithParams}`);
        }
      },
      error: (error) =>
        console.error(`[SSR api] ✗ ${request.method} ${request.urlWithParams}`, error),
    }),
  );
};
