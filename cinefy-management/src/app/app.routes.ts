import { Routes } from '@angular/router';
import { AppLayout } from '../layout/app-layout/app-layout';
import { AuthLayout } from '../layout/auth-layout/auth-layout';
import { authGuard, guestGuard } from '../shared/guards';
import {
  DashboardPage,
  HallsPage,
  MoviesPage,
  PaymentPage,
  StaffPage,
  LoginPage,
  ForgotPasswordPage,
} from '../pages';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardPage,
      },
      {
        path: 'halls',
        component: HallsPage,
      },
      {
        path: 'movies',
        component: MoviesPage,
      },
      {
        path: 'payment',
        component: PaymentPage,
      },
      {
        path: 'staff',
        component: StaffPage,
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
