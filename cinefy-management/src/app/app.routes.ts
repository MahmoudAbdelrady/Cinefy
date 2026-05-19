import { Routes } from '@angular/router';
import { AppLayout } from '../layout/app-layout/app-layout';
import { AuthLayout } from '../layout/auth-layout/auth-layout';
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
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
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
  {
    path: '',
    component: AppLayout,
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
];
