import { Routes } from '@angular/router';
import { AppLayout } from '../layout/app-layout/app-layout';
import { HomePage } from '../pages';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      {
        path: '',
        component: HomePage,
      },
    ],
  },
];
