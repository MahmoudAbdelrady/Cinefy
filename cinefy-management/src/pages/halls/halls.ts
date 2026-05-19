import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PlusIcon, SettingsIcon } from '../../shared/icons';
import { HeaderActionsService } from '../../services';
import { NgpButton } from 'ng-primitives/button';
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
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    HallsStatisticsComponent,
    HallsListComponent,
    HallConfigModalComponent,
    ManageHallTypesModalComponent,
  ],
  templateUrl: './halls.html',
  styleUrl: './halls.scss',
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

  ngOnInit() {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
