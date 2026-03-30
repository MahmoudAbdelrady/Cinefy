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
import { LucideAngularModule, Plus, Settings } from 'lucide-angular';
import { HeaderActionsService } from '../../services';
import { NgpButton } from 'ng-primitives/button';
import { HallsStatisticsComponent } from '../../components/halls/halls-statistics/halls-statistics';
import { HallsListComponent, HallItem } from '../../components/halls/halls-list/halls-list';
import { PaginatedResponse } from '../../shared/types';

@Component({
  selector: 'halls-page',
  imports: [LucideAngularModule, NgpButton, HallsStatisticsComponent, HallsListComponent],
  templateUrl: './halls.html',
  styleUrl: './halls.scss',
})
export class HallsPage implements OnInit {
  protected SettingsIcon = Settings;
  protected PlusIcon = Plus;

  protected readonly currentPage = signal(1);
  protected readonly pageSize = 5;
  protected readonly pageCount = computed(() => Math.ceil(this.hallItems.length / this.pageSize));

  private readonly hallItems: HallItem[] = [
    {
      id: '1',
      name: 'Hall 1',
      status: 'now_showing',
      rows: 10,
      seatsPerRow: 10,
      currentMovie: 'Spider-Man: No Way Home',
      occupancy: 85,
    },
    {
      id: '2',
      name: 'Hall 2',
      status: 'scheduled',
      rows: 12,
      seatsPerRow: 12,
      currentMovie: 'Dune: Part Two',
      occupancy: 92,
    },
    {
      id: '3',
      name: 'Hall 3',
      status: 'under_maintenance',
      rows: 8,
      seatsPerRow: 8,
      currentMovie: 'The Matrix Resurrections',
      occupancy: 78,
    },
    {
      id: '4',
      name: 'Hall 4',
      status: 'inactive',
      rows: 8,
      seatsPerRow: 8,
      currentMovie: null,
      occupancy: 0,
    },
    {
      id: '5',
      name: 'IMAX Hall',
      status: 'now_showing',
      rows: 14,
      seatsPerRow: 14,
      currentMovie: 'Avatar: The Way of Water',
      occupancy: 95,
    },
    {
      id: '6',
      name: 'Hall 5',
      status: 'scheduled',
      rows: 10,
      seatsPerRow: 10,
      currentMovie: null,
      occupancy: 0,
    },
    {
      id: '7',
      name: '4DX Hall',
      status: 'under_maintenance',
      rows: 6,
      seatsPerRow: 6,
      currentMovie: null,
      occupancy: 0,
    },
    {
      id: '8',
      name: 'Hall 6',
      status: null,
      rows: 10,
      seatsPerRow: 10,
      currentMovie: null,
      occupancy: 0,
    },
  ];
  protected readonly hallPage = signal<PaginatedResponse<HallItem>>({
    items: this.hallItems,
    totalItems: this.hallItems.length,
    page: this.currentPage(),
    pageCount: this.pageCount(),
    pageSize: this.pageSize,
  });
  protected readonly hallItemsPaginated = computed(() =>
    this.hallPage().items.slice(
      (this.currentPage() - 1) * this.pageSize,
      this.currentPage() * this.pageSize,
    ),
  );

  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  ngOnInit() {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
