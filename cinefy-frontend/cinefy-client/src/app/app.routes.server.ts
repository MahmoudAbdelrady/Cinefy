import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'membership/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'movies/:movieId/seats/:showtimeId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'checkout/:bookingId',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
