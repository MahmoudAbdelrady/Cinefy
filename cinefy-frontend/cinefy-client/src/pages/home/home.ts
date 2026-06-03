import { Component } from '@angular/core';
import { HighlightedMovieComponent } from '../../components';

@Component({
  selector: 'home-page',
  imports: [HighlightedMovieComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {}
