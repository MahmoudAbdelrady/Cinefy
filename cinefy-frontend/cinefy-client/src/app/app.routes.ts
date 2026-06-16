import { Routes } from '@angular/router';
import { AppLayout } from '../layout/app-layout/app-layout';
import { HomePage, MovieDetailPage, MoviesPage } from '../pages';

export const routes: Routes = [
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
        path: 'movie-detail/:movieId',
        component: MovieDetailPage,
      },
    ],
  },
];
