import { Routes } from '@angular/router';
import { AppLayout } from '../layout/app-layout/app-layout';
import { AuthLayout } from '../layout/auth-layout/auth-layout';
import { authGuard, guestGuard } from '../shared/guards';
import {
  BookingConfirmationPage,
  CheckoutPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  MovieDetailPage,
  MoviesPage,
  NotFoundPage,
  OAuthCallbackPage,
  PrivacyPolicyPage,
  ProfilePage,
  SeatSelectionPage,
  SignUpPage,
} from '../pages';

export const routes: Routes = [
  {
    path: 'membership',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        component: LoginPage,
      },
      {
        path: 'signup',
        component: SignUpPage,
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordPage,
      },
      {
        path: 'oauth/callback',
        component: OAuthCallbackPage,
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
        canActivate: [authGuard],
      },
      {
        path: 'checkout/:bookingId',
        component: CheckoutPage,
        canActivate: [authGuard],
      },
      {
        path: 'booking-confirmation/:bookingId',
        component: BookingConfirmationPage,
        canActivate: [authGuard],
      },
      {
        path: 'profile',
        component: ProfilePage,
        canActivate: [authGuard],
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyPage,
      },
      {
        path: '**',
        component: NotFoundPage,
      },
    ],
  },
];
