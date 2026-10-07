import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../services';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService
    .getAuthStatus()
    .pipe(map((status) => (status === 'AUTHENTICATED' ? router.createUrlTree(['/']) : true)));
};
