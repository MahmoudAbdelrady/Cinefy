import { inject } from '@angular/core';
import { CanMatchFn, UrlSegment } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { AuthService, StaffService } from '../../services';
import { canAccessRoute } from '../access';

function routePath(segments: UrlSegment[]): string {
  return '/' + segments.map((segment) => segment.path).join('/');
}

export const positionCanMatch: CanMatchFn = (_route, segments) => {
  const authService = inject(AuthService);
  const staffService = inject(StaffService);

  return authService.isAuthenticated().pipe(
    switchMap((authenticated) => {
      if (!authenticated) return of(true);

      return staffService
        .getCurrentStaffMember()
        .pipe(map((user) => canAccessRoute(routePath(segments), user.position)));
    }),
  );
};
