import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { Tooltip } from 'primeng/tooltip';
import {
  BriefCaseIcon,
  CalendarIcon,
  EditIcon,
  EmailIcon,
  PhoneIcon,
  UserIcon,
  WarningIcon,
} from '../../../shared/icons';
import { DatePipe } from '@angular/common';
import {
  CinefyDialog,
  CinefyDialogHeader,
  CinefyEmptyState,
  CinefyLoadingSpinner,
} from 'cinefy-ui/components';
import { PhoneFormatPipe, Time12hPipe } from 'cinefy-ui/pipes';
import {
  EMPLOYMENT_TYPE_LABELS,
  USER_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type StaffMemberDetail,
} from '../../../shared/types';
import { skipServerErrorToast } from '../../../app/core/interceptors';
import { StaffService } from '../../../services';
import { canManageStaffMember } from '../../../shared/access';

@Component({
  selector: 'staff-details',
  imports: [
    CinefyDialog,
    CinefyDialogHeader,
    LucideDynamicIcon,
    Tooltip,
    CinefyLoadingSpinner,
    CinefyEmptyState,
    DatePipe,
    Time12hPipe,
    PhoneFormatPipe,
  ],
  templateUrl: './staff-details.html',
  styleUrl: './staff-details.scss',
})
export class StaffDetailsComponent {
  protected readonly icons = {
    CalendarIcon,
    EditIcon,
    EmailIcon,
    PhoneIcon,
    BriefCaseIcon,
    UserIcon,
    WarningIcon,
  };

  private readonly staffService = inject(StaffService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly dialog = viewChild.required(CinefyDialog);

  protected readonly employmentTypeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly positionLabels = USER_POSITION_LABELS;
  protected readonly weekDayLabels = WEEK_DAY_LABELS;

  readonly staffMemberId = input.required<string>();

  readonly closed = output<void>();
  readonly editRequested = output<StaffMemberDetail>();

  protected readonly staffMember = signal<StaffMemberDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());

  protected readonly canManage = computed(() => {
    const user = this.currentUser();
    const member = this.staffMember();
    return user && member ? canManageStaffMember(user.position, member.position) : false;
  });

  constructor() {
    afterNextRender(() => {
      this.loading.set(true);
      this.staffService
        .getStaffMember(this.staffMemberId(), skipServerErrorToast())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (member) => {
            this.staffMember.set(member);
            this.loading.set(false);
          },
          error: () => {
            this.failed.set(true);
            this.loading.set(false);
          },
        });
    });
  }

  protected requestEdit(): void {
    const member = this.staffMember();
    if (!member) return;
    this.dialog().close();
    this.editRequested.emit(member);
  }
}
