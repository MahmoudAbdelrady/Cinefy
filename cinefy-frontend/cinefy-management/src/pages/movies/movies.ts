import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { PlusIcon } from '../../shared/icons';
import { canManage as canManagePosition } from '../../shared/access';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  CurrentShowtimesComponent,
  ManageShowtimeModalComponent,
  MoviesStatisticsComponent,
  UpcomingMoviesComponent,
} from '../../components';
import { HeaderActionsService, StaffService } from '../../services';

@Component({
  selector: 'movies-page',
  imports: [
    LucideDynamicIcon,
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
  private staffService = inject(StaffService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());
  protected readonly canManage = computed(() => {
    const user = this.currentUser();
    return user ? canManagePosition(user.position) : false;
  });

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
