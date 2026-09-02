import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { PlusIcon, SettingsIcon } from '../../shared/icons';
import { HeaderActionsService } from '../../services';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  HallsListComponent,
  HallConfigModalComponent,
  ManageHallTypesModalComponent,
  HallsStatisticsComponent,
} from '../../components';

@Component({
  selector: 'halls-page',
  imports: [
    LucideDynamicIcon,
    NgpDialogTrigger,
    HallsStatisticsComponent,
    HallsListComponent,
    HallConfigModalComponent,
    ManageHallTypesModalComponent,
  ],
  templateUrl: './halls.html',
})
export class HallsPage implements OnInit {
  protected readonly icons = {
    PlusIcon,
    SettingsIcon,
  };

  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');
  protected readonly hallsList = viewChild.required(HallsListComponent);
  protected readonly hallsStatistics = viewChild.required(HallsStatisticsComponent);

  protected readonly addHallVisible = signal(false);

  ngOnInit() {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
