import { Component, computed, input, model } from '@angular/core';
import {
  Eye,
  Film,
  LayoutDashboard,
  LucideAngularModule,
  Search,
  Trash2,
  Users,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { PaginationComponent } from '../../pagination/pagination';

export interface HallItem {
  id: string;
  name: string;
  status: 'now_showing' | 'scheduled' | 'under_maintenance' | 'inactive' | null;
  rows: number;
  seatsPerRow: number;
  currentMovie: string | null;
  occupancy: number;
}

@Component({
  selector: 'halls-list',
  imports: [LucideAngularModule, NgpButton, PaginationComponent],
  templateUrl: './halls-list.html',
  styleUrl: './halls-list.scss',
})
export class HallsListComponent {
  readonly items = input.required<HallItem[]>();
  readonly totalItems = input.required<number>();
  readonly page = model.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageSize = input.required<number>();

  protected readonly SearchIcon = Search;
  protected readonly LayoutIcon = LayoutDashboard;
  protected readonly PeopleIcon = Users;
  protected readonly FilmIcon = Film;
  protected readonly EyeIcon = Eye;
  protected readonly DeleteIcon = Trash2;

  protected readonly statusLabels: Record<string, string> = {
    now_showing: 'Now Showing',
    scheduled: 'Scheduled',
    under_maintenance: 'Under Maintenance',
    inactive: 'Inactive',
  };
}
