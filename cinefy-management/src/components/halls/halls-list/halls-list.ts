import { Component, input, model } from '@angular/core';
import {
  CircleAlert,
  Eye,
  Film,
  LayoutDashboard,
  LucideAngularModule,
  Search,
  Trash2,
  Users,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { PaginationComponent } from '../../pagination/pagination';
import { ModalComponent } from '../../modal/modal';
import { HallConfigModalComponent } from '../hall-config-modal/hall-config-modal';
import { HallItem, HallListItem } from '../../../shared/types';

@Component({
  selector: 'halls-list',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    PaginationComponent,
    ModalComponent,
    HallConfigModalComponent,
  ],
  templateUrl: './halls-list.html',
  styleUrl: './halls-list.scss',
})
export class HallsListComponent {
  readonly items = input.required<HallItem[]>();
  readonly totalItems = input.required<number>();
  readonly page = model.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly existingHalls = input.required<HallListItem[]>();

  protected readonly SearchIcon = Search;
  protected readonly LayoutIcon = LayoutDashboard;
  protected readonly PeopleIcon = Users;
  protected readonly FilmIcon = Film;
  protected readonly EyeIcon = Eye;
  protected readonly DeleteIcon = Trash2;
  protected readonly AlertIcon = CircleAlert;

  protected readonly statusLabels: Record<string, string> = {
    now_showing: 'Now Showing',
    scheduled: 'Scheduled',
    under_maintenance: 'Under Maintenance',
    inactive: 'Inactive',
  };
}
