import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { PlusIcon, QrCodeIcon, TicketIcon } from '../../shared/icons';
import { canManage as canManagePosition, canBook as canBookPosition } from '../../shared/access';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { ModalComponent } from 'cinefy-ui/components';
import {
  ActiveBookingsListComponent,
  CurrentShowtimesComponent,
  ManageShowtimeModalComponent,
  MoviesStatisticsComponent,
  ScanTicketModalComponent,
  UpcomingMoviesComponent,
} from '../../components';
import { HeaderActionsService, StaffService } from '../../services';

@Component({
  selector: 'movies-page',
  imports: [
    LucideDynamicIcon,
    NgpDialogTrigger,
    ManageShowtimeModalComponent,
    MoviesStatisticsComponent,
    CurrentShowtimesComponent,
    UpcomingMoviesComponent,
    ActiveBookingsListComponent,
    ScanTicketModalComponent,
    ModalComponent,
  ],
  templateUrl: './movies.html',
  styleUrl: './movies.scss',
})
export class MoviesPage implements OnInit {
  protected readonly icons = {
    PlusIcon,
    QrCodeIcon,
    TicketIcon,
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
  protected readonly canBook = computed(() => {
    const user = this.currentUser();
    return user ? canBookPosition(user.position) : false;
  });

  protected readonly activeBookingsVisible = signal(false);

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
