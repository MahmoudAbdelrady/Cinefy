import { inject } from '@angular/core';
import { CanMatchFn, UrlSegment } from '@angular/router';
import { map } from 'rxjs';
import { StaffService } from '../../services';
import { canAccessRoute } from '../access';

function routePath(segments: UrlSegment[]): string {
  return '/' + segments.map((segment) => segment.path).join('/');
}

export const positionCanMatch: CanMatchFn = (_route, segments) => {
  const staffService = inject(StaffService);

  return staffService
    .getCurrentStaffMember()
    .pipe(map((user) => canAccessRoute(routePath(segments), user.position)));
};
