import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ClockIcon, RatingIcon, PlayIcon } from '../../../shared/icons';

@Component({
  selector: 'highlighted-movie',
  imports: [LucideAngularModule],
  templateUrl: './highlighted-movie.html',
  styleUrl: './highlighted-movie.scss',
})
export class HighlightedMovieComponent {
  protected readonly icons = {
    ClockIcon,
    RatingIcon,
    PlayIcon,
  };
}
