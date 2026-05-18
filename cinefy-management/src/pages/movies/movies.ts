import { Component, DestroyRef, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PlusIcon } from '../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  CurrentShowtimesComponent,
  ManageShowtimeModalComponent,
  MoviesStatisticsComponent,
  UpcomingMoviesComponent,
} from '../../components';
import { HeaderActionsService } from '../../services';

@Component({
  selector: 'movies-page',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    ManageShowtimeModalComponent,
    MoviesStatisticsComponent,
    CurrentShowtimesComponent,
    UpcomingMoviesComponent,
  ],
  templateUrl: './movies.html',
  styleUrl: './movies.scss',
})
export class MoviesPage implements OnInit {
  protected readonly icons = {
    PlusIcon,
  };

  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
