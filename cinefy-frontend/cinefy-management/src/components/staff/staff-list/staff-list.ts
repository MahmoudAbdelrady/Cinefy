import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  AlertIcon,
  CalendarIcon,
  ClockIcon,
  DeleteIcon,
  EditIcon,
  EmailIcon,
  EyeIcon,
  PhoneIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from '../../../shared/icons';
import {
  CinefyDialog,
  CinefyDialogFooter,
  CinefyPaginator,
  CinefySelect,
  CinefyInput,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { PhoneFormatPipe, Time12hPipe } from 'cinefy-ui/pipes';
import type { PaginatedResponse } from 'cinefy-ui/types';
import { StaffDetailsComponent } from '../staff-details/staff-details';
import { ManageStaffModalComponent } from '../manage-staff-modal/manage-staff-modal';
import {
  USER_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type CoverageChange,
  type StaffMemberDetail,
  type StaffMemberSummary,
  type UserPosition,
} from '../../../shared/types';
import { StaffService } from '../../../services';
import { canManageStaffMember } from '../../../shared/access';
import { SEARCH_DEBOUNCE_MS } from '../../../shared/constants';

@Component({
  selector: 'staff-list',
  imports: [
    LucideDynamicIcon,
    ReactiveFormsModule,
    CinefySelect,
    CinefyInput,
    CinefyPaginator,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CinefyDialog,
    CinefyDialogFooter,
    StaffDetailsComponent,
    ManageStaffModalComponent,
    Time12hPipe,
    PhoneFormatPipe,
  ],
  templateUrl: './staff-list.html',
  styleUrl: './staff-list.scss',
})
export class StaffListComponent {
  protected readonly icons = {
    SearchIcon,
    EmailIcon,
    PhoneIcon,
    CalendarIcon,
    ClockIcon,
    UsersIcon,
    EyeIcon,
    EditIcon,
    DeleteIcon,
    AlertIcon,
    SlidersHorizontalIcon,
  };

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly positionLabels = USER_POSITION_LABELS;
  protected readonly weekDayLabels = WEEK_DAY_LABELS;
  protected readonly pageSize = 10;

  readonly coverageChanged = output<CoverageChange>();

  protected readonly pendingEditId = signal<string | null>(null);
  protected readonly pendingEditMember = signal<StaffMemberDetail | null>(null);
  protected readonly editVisible = signal(false);
  protected readonly memberToView = signal<string | null>(null);
  protected readonly memberToDelete = signal<StaffMemberSummary | null>(null);
  protected readonly deletingStaffIds = signal<ReadonlySet<string>>(new Set());

  protected readonly positionFilter = signal<UserPosition | undefined>(undefined);
  protected readonly page = signal(0);

  protected readonly loading = signal(true);
  protected readonly staffPage = signal<PaginatedResponse<StaffMemberSummary> | null>(null);

  protected readonly filterForm = new FormGroup({
    search: new FormControl<string>('', { nonNullable: true }),
    position: new FormControl<UserPosition | null>(null),
  });

  private readonly appliedSearch = signal('');

  protected readonly staffPositionEntries = (
    Object.entries(USER_POSITION_LABELS) as [UserPosition, string][]
  )
    .filter(([value]) => value !== 'ADMIN')
    .map(([value, label]) => ({ value, label }));

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());

  protected readonly staffMembers = computed(() => this.staffPage()?.content ?? []);
  protected readonly totalItems = computed(() => this.staffPage()?.page.totalElements ?? 0);
  protected readonly pageCount = computed(() =>
    Math.max(1, this.staffPage()?.page.totalPages ?? 1),
  );

  protected readonly hasFilters = computed(
    () => this.appliedSearch() !== '' || this.positionFilter() !== undefined,
  );

  protected readonly canManageRow = (member: StaffMemberSummary): boolean => {
    const user = this.currentUser();
    return user ? canManageStaffMember(user.position, member.position) : false;
  };

  private readonly staff$ = combineLatest([
    this.filterForm.controls.search.valueChanges.pipe(
      startWith(''),
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      tap((search) => {
        this.page.set(0);
        this.appliedSearch.set(search.trim());
      }),
    ),
    toObservable(this.positionFilter),
    toObservable(this.page),
  ]);

  constructor() {
    this.filterForm.controls.position.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((position) => {
        this.positionFilter.set(position ?? undefined);
        this.page.set(0);
      });

    afterNextRender(() => {
      this.staff$
        .pipe(
          tap(() => this.loading.set(true)),
          switchMap(([search, position, page]) =>
            this.staffService.getStaffMembers(search || undefined, position, {
              page,
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
          error: () => this.loading.set(false),
        });
    });
  }

  onStaffMemberUpdated(member: StaffMemberSummary): void {
    const staffPage = this.staffPage();
    if (!staffPage) return;
    const index = staffPage.content.findIndex((m) => m.id === member.id);
    if (index === -1) return;
    const previous = staffPage.content[index];
    const content = [...staffPage.content];
    content[index] = member;
    this.staffPage.set({ ...staffPage, content });
    if (previous.position !== member.position) {
      this.coverageChanged.emit({
        action: 'reassign',
        from: previous.position,
        to: member.position,
      });
    }
  }

  onStaffMemberCreated(member: StaffMemberSummary): void {
    const staffPage = this.staffPage();
    if (!staffPage) return;
    const pageIsFull = staffPage.content.length >= staffPage.page.size;
    this.staffPage.set({
      ...staffPage,
      content: pageIsFull ? staffPage.content : [...staffPage.content, member],
      page: {
        ...staffPage.page,
        totalElements: staffPage.page.totalElements + 1,
        totalPages: pageIsFull ? staffPage.page.totalPages + 1 : staffPage.page.totalPages,
      },
    });
    this.coverageChanged.emit({ action: 'add', position: member.position });
  }

  protected getInitials(fullName: string): string {
    const [first, last] = fullName.split(' ');
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  }

  protected openEditDialog(idOrMember: string | StaffMemberDetail): void {
    if (typeof idOrMember === 'string') {
      this.pendingEditId.set(idOrMember);
      this.pendingEditMember.set(null);
    } else {
      this.pendingEditId.set(null);
      this.pendingEditMember.set(idOrMember);
    }
    this.editVisible.set(true);
  }

  protected deleteStaffMember(id: string): void {
    if (this.deletingStaffIds().has(id)) return;
    this.deletingStaffIds.update((current) => new Set(current).add(id));
    this.staffService.deleteStaffMember(id).subscribe({
      next: () => {
        const staffPage = this.staffPage();
        if (staffPage) {
          const deletedPosition = staffPage.content.find((m) => m.id === id)?.position;
          const content = staffPage.content.filter((m) => m.id !== id);
          if (content.length === 0 && this.page() > 0) {
            this.page.update((p) => p - 1);
          } else {
            this.staffPage.set({
              ...staffPage,
              content,
              page: { ...staffPage.page, totalElements: staffPage.page.totalElements - 1 },
            });
          }
          if (deletedPosition) {
            this.coverageChanged.emit({ action: 'delete', position: deletedPosition });
          }
        }
        this.deletingStaffIds.update((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        this.toastService.success('Staff member deleted');
        this.memberToDelete.set(null);
      },
      error: () => {
        this.deletingStaffIds.update((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      },
    });
  }
}
