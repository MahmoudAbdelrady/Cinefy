import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (SAFE_METHODS.has(req.method) || !isPlatformBrowser(inject(PLATFORM_ID))) {
    return next(req);
  }

  const token = readCookie(CSRF_COOKIE);
  if (!token) {
    return next(req);
  }

  return next(req.clone({ headers: req.headers.set(CSRF_HEADER, token) }));
};

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
