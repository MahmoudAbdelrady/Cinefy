import { inject } from '@angular/core';
import { CanMatchFn, UrlSegment } from '@angular/router';
import { map, of, switchMap, take } from 'rxjs';
import { AuthService, StaffService } from '../../services';
import { canAccessRoute } from '../access';

function routePath(segments: UrlSegment[]): string {
  return '/' + segments.map((segment) => segment.path).join('/');
}

export const positionCanMatch: CanMatchFn = (_, segments) => {
  const authService = inject(AuthService);
  const staffService = inject(StaffService);

  return authService.getAuthStatus().pipe(
    switchMap((status) => {
      if (status !== 'AUTHENTICATED') return of(true);

      return staffService.getCurrentStaffMember().pipe(
        take(1),
        map((user) => canAccessRoute(routePath(segments), user.position)),
      );
    }),
  );
};
