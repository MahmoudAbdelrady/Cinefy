import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../services';

export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthStatus().pipe(
    map((status) =>
      status === 'UNAUTHENTICATED'
        ? router.createUrlTree(['/membership/login'], {
            queryParams: { redirectUrl: state.url },
          })
        : true,
    ),
  );
};
