import { createBrowserRouter } from 'react-router'
import { RootLayout } from './RootLayout'
import { HomePage } from '@/pages/home/HomePage'
import { MoviesPage } from '@/pages/movies/MoviesPage'
import { MovieDetailPage } from '@/pages/movie-detail/MovieDetailPage'
import { SeatSelectionPage } from '@/pages/seat-selection/SeatSelectionPage'
import { CheckoutPage } from '@/pages/checkout/CheckoutPage'
import { ConfirmationPage } from '@/pages/confirmation/ConfirmationPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'movies/:movieId', element: <MovieDetailPage /> },
      { path: 'movies/:movieId/seats', element: <SeatSelectionPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'confirmation', element: <ConfirmationPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
