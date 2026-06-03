import { Component } from '@angular/core';
import { HighlightedMovieComponent } from '../../components';
import { RouterLink } from '@angular/router';

interface NowShowingMovie {
  title: string;
  genre: string;
  code: string;
  posterUrl: string;
  is3D: boolean;
}

@Component({
  selector: 'home-page',
  imports: [HighlightedMovieComponent, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
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
}
