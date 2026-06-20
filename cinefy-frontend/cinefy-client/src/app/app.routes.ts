import { Routes } from '@angular/router';
import { AppLayout } from '../layout/app-layout/app-layout';
import { AuthLayout } from '../layout/auth-layout/auth-layout';
import {
  HomePage,
  LoginPage,
  MovieDetailPage,
  MoviesPage,
  SeatSelectionPage,
  SignUpPage,
} from '../pages';

export const routes: Routes = [
  {
    path: 'membership',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        component: LoginPage,
      },
      {
        path: 'signup',
        component: SignUpPage,
      },
    ],
  },
  {
    path: '',
    component: AppLayout,
    children: [
      {
        path: '',
        component: HomePage,
      },
      {
        path: 'movies',
        component: MoviesPage,
      },
      {
        path: 'movies/:movieId',
        component: MovieDetailPage,
      },
      {
        path: 'movies/:movieId/seats/:showtimeId',
        component: SeatSelectionPage,
      },
    ],
  },
];
