import { Routes } from '@angular/router';
import { AppLayout } from '../layout/app-layout';
import { DashboardPage, HallsPage, MoviesPage, PaymentPage } from '../pages';

export const routes: Routes = [
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
    ],
  },
];
