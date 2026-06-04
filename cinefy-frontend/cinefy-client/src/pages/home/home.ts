import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from 'cinefy-ui/components';
import { HighlightedMovieComponent } from '../../components';
import { ClapperboardIcon, CalendarIcon } from '../../shared/icons';

interface NowShowingMovie {
  title: string;
  genre: string;
  code: string;
  posterUrl: string;
  is3D: boolean;
}

interface UpcomingMovie {
  title: string;
  code: string;
  releaseDate: string;
  posterUrl: string;
}

@Component({
  selector: 'home-page',
  imports: [HighlightedMovieComponent, RouterLink, DatePipe, EmptyStateComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  protected readonly icons = {
    ClapperboardIcon,
    CalendarIcon,
  };

  protected readonly nowShowingMovies: NowShowingMovie[] = [
    {
      title: 'Dune: Part Two',
      genre: 'Sci-Fi, Adventure',
      code: 'dune-part-two',
      posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      is3D: true,
    },
    {
      title: 'Oppenheimer',
      genre: 'Biography, Drama, History',
      code: 'oppenheimer',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      is3D: false,
    },
    {
      title: 'Furiosa: A Mad Max Saga',
      genre: 'Action, Adventure, Sci-Fi',
      code: 'furiosa',
      posterUrl: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
      is3D: false,
    },
    {
      title: 'Deadpool & Wolverine',
      genre: 'Action, Comedy, Sci-Fi',
      code: 'deadpool-wolverine',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      is3D: false,
    },
    {
      title: 'Inside Out 2',
      genre: 'Animation, Adventure, Comedy',
      code: 'inside-out-2',
      posterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
      is3D: false,
    },
    {
      title: 'Kingdom of the Planet of the Apes',
      genre: 'Action, Adventure, Sci-Fi',
      code: 'kingdom-of-the-planet-of-the-apes',
      posterUrl: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
      is3D: false,
    },
  ];

  protected readonly upcomingMovies: UpcomingMovie[] = [
    {
      title: 'Toy Story 5',
      code: 'toy-story-5',
      releaseDate: '2026-06-17',
      posterUrl: 'https://image.tmdb.org/t/p/w500/7BuN6lQCAq1tLz2l3g6sHVSFGib.jpg',
    },
    {
      title: 'Supergirl',
      code: 'supergirl',
      releaseDate: '2026-06-24',
      posterUrl: 'https://image.tmdb.org/t/p/w500/niSvU02l2BONH9ivubV6K1a5QiK.jpg',
    },
    {
      title: 'Spider-Man: Brand New Day',
      code: 'spider-man-brand-new-day',
      releaseDate: '2026-07-29',
      posterUrl: 'https://image.tmdb.org/t/p/w500/yyB2VJEW3an2xCdcYCPQhn9QERR.jpg',
    },
    {
      title: 'Avatar Aang: The Last Airbender',
      code: 'avatar-aang-the-last-airbender',
      releaseDate: '2026-10-09',
      posterUrl: 'https://image.tmdb.org/t/p/w500/29Jdsak3SrwGds5k1t43kH6Khed.jpg',
    },
    {
      title: 'Dune: Part Three',
      code: 'dune-part-three',
      releaseDate: '2026-12-16',
      posterUrl: 'https://image.tmdb.org/t/p/w500/b4wekkUaxExzOeGe7hKXzhnyXHt.jpg',
    },
    {
      title: 'Avengers: Doomsday',
      code: 'avengers-doomsday',
      releaseDate: '2026-12-16',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8HkIe2i4ScpCkcX9SzZ9IPasqWV.jpg',
    },
  ];
}
