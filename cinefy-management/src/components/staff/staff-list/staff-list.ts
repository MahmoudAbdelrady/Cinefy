import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { combineLatest, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import {
  CalendarClock,
  CircleAlert,
  Eye,
  LucideAngularModule,
  Mail,
  Phone,
  Search,
  SquarePen,
  Trash2,
  Users,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogManager, NgpDialogTrigger } from 'ng-primitives/dialog';
import { CustomSelectComponent } from '../../drop-down/custom-select/custom-select';
import { InputField } from '../../input-field/input-field';
import { ModalComponent } from '../../modal/modal';
import { PaginationComponent } from '../../pagination/pagination';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { StaffDetailsComponent } from '../staff-details/staff-details';
import { ManageStaffModalComponent } from '../manage-staff-modal/manage-staff-modal';
import {
  PaginatedResponse,
  STAFF_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type StaffMemberDetail,
  type StaffMemberSummary,
  type StaffPosition,
} from '../../../shared/types';
import { StaffService, ToastService } from '../../../services';

@Component({
  selector: 'staff-list',
  imports: [
    LucideAngularModule,
    CustomSelectComponent,
    InputField,
    PaginationComponent,
    LoadingSpinnerComponent,
    NgpButton,
    NgpDialogTrigger,
    ModalComponent,
    StaffDetailsComponent,
    ManageStaffModalComponent,
  ],
  templateUrl: './staff-list.html',
  styleUrl: './staff-list.scss',
})
export class StaffListComponent {
  protected readonly SearchIcon = Search;
  protected readonly EmailIcon = Mail;
  protected readonly PhoneIcon = Phone;
  protected readonly CalendarClockIcon = CalendarClock;
  protected readonly UsersIcon = Users;
  protected readonly EyeIcon = Eye;
  protected readonly EditIcon = SquarePen;
  protected readonly DeleteIcon = Trash2;
  protected readonly AlertIcon = CircleAlert;

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogManager = inject(NgpDialogManager);

  protected readonly editTemplate = viewChild.required<TemplateRef<unknown>>('editDialog');
  protected readonly pendingEditId = signal<string | null>(null);
  protected readonly pendingEditMember = signal<StaffMemberDetail | null>(null);
  protected readonly deletingStaffIds = signal<ReadonlySet<string>>(new Set());

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  protected readonly search = signal('');
  protected readonly positionFilter = signal<StaffPosition | undefined>(undefined);
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly loading = signal(true);
  protected readonly staffPage = signal<PaginatedResponse<StaffMemberSummary> | null>(null);
  protected readonly staffMembers = computed(() => this.staffPage()?.content ?? []);
  protected readonly totalItems = computed(() => this.staffPage()?.page.totalElements ?? 0);
  protected readonly pageCount = computed(() =>
    Math.max(1, this.staffPage()?.page.totalPages ?? 1),
  );

  protected readonly positionLabels = STAFF_POSITION_LABELS;
  protected readonly weekDayLabels = WEEK_DAY_LABELS;
  protected readonly staffPositions = Object.keys(STAFF_POSITION_LABELS) as StaffPosition[];

  private readonly staff$ = combineLatest([
    toObservable(this.search).pipe(debounceTime(300), distinctUntilChanged()),
    toObservable(this.positionFilter),
    toObservable(this.page),
  ]);

  constructor() {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.search.set(value);
      this.page.set(1);
    });

    afterNextRender(() => {
      this.staff$
        .pipe(
          tap(() => this.loading.set(true)),
          switchMap(([search, position, page]) =>
            this.staffService.getStaffMembers(search || undefined, position, {
              page: page - 1,
              size: this.pageSize,
            }),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (staffPage) => {
            this.staffPage.set(staffPage);
            this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.toastService.error(err.error?.message ?? 'Failed to load staff members');
          },
        });
    });
  }

  protected readonly positionDisplayFn = (position: StaffPosition): string =>
    STAFF_POSITION_LABELS[position];

  protected onPositionFilterChange(position: StaffPosition): void {
    this.positionFilter.set(position);
    this.page.set(1);
  }

  protected onPositionFilterCleared(): void {
    this.positionFilter.set(undefined);
    this.page.set(1);
  }

  protected openEditDialog(idOrMember: string | StaffMemberDetail): void {
    if (typeof idOrMember === 'string') {
      this.pendingEditId.set(idOrMember);
      this.pendingEditMember.set(null);
    } else {
      this.pendingEditId.set(null);
      this.pendingEditMember.set(idOrMember);
    }
    this.dialogManager.open(this.editTemplate() as never);
  }

  protected deleteStaffMember(id: string, close: () => void): void {
    if (this.deletingStaffIds().has(id)) return;
    this.deletingStaffIds.update((current) => new Set(current).add(id));
    this.staffService.deleteStaffMember(id).subscribe({
      next: () => {
        this.staffPage.update((page) =>
          page
            ? {
                ...page,
                content: page.content.filter((m) => m.id !== id),
                page: { ...page.page, totalElements: page.page.totalElements - 1 },
              }
            : page,
        );
        this.deletingStaffIds.update((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        this.toastService.success('Staff member deleted');
        close();
      },
      error: (err: HttpErrorResponse) => {
        this.deletingStaffIds.update((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        this.toastService.error(err.error?.message ?? 'Failed to delete staff member');
      },
    });
  }
}
