import { Routes } from '@angular/router';
import { AppLayout } from '../layout/app-layout/app-layout';
import { AuthLayout } from '../layout/auth-layout/auth-layout';
import { authGuard, guestGuard, positionCanMatch } from '../shared/guards';
import {
  DashboardPage,
  HallsPage,
  MoviesPage,
  PaymentPage,
  StaffPage,
  LoginPage,
  ForgotPasswordPage,
  AccessDeniedPage,
} from '../pages';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: DashboardPage,
        canMatch: [positionCanMatch],
      },
      {
        path: 'halls',
        component: HallsPage,
        canMatch: [positionCanMatch],
      },
      {
        path: 'halls',
        component: AccessDeniedPage,
      },
      {
        path: 'movies',
        component: MoviesPage,
        canMatch: [positionCanMatch],
      },
      {
        path: 'movies',
        component: AccessDeniedPage,
      },
      {
        path: 'payment',
        component: PaymentPage,
        canMatch: [positionCanMatch],
      },
      {
        path: 'payment',
        component: AccessDeniedPage,
      },
      {
        path: 'staff',
        component: StaffPage,
        canMatch: [positionCanMatch],
      },
      {
        path: 'staff',
        component: AccessDeniedPage,
      },
    ],
  },
  {
    path: '',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        component: LoginPage,
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordPage,
      },
    ],
  },
];
