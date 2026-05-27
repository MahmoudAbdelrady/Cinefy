import { afterNextRender, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import {
  BriefCaseIcon,
  CalendarIcon,
  EditIcon,
  EmailIcon,
  PhoneIcon,
  AtSignIcon,
} from '../../../shared/icons';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../modal/modal';
import { PhoneFormatPipe, Time12hPipe } from '../../../shared/pipes';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import {
  EMPLOYMENT_TYPE_LABELS,
  USER_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type StaffMemberDetail,
} from '../../../shared/types';
import { StaffService, ToastService } from '../../../services';
import { canManageStaffMember } from '../../../shared/access';

@Component({
  selector: 'staff-details',
  imports: [
    ModalComponent,
    LucideAngularModule,
    LoadingSpinnerComponent,
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
    AtSignIcon,
    BriefCaseIcon,
  };

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);

  protected readonly employmentTypeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly positionLabels = USER_POSITION_LABELS;
  protected readonly weekDayLabels = WEEK_DAY_LABELS;

  readonly close = input.required<() => void>();
  readonly staffMemberId = input.required<string>();

  readonly editRequested = output<StaffMemberDetail>();

  protected readonly staffMember = signal<StaffMemberDetail | null>(null);
  protected readonly loading = signal(false);

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());

  protected readonly initials = computed(() => {
    const member = this.staffMember();
    if (!member) return '';
    return (member.firstName.charAt(0) + member.lastName.charAt(0)).toUpperCase();
  });

  protected readonly canManage = computed(() => {
    const user = this.currentUser();
    const member = this.staffMember();
    return user && member ? canManageStaffMember(user.position, member.position) : false;
  });

  constructor() {
    afterNextRender(() => {
      this.loading.set(true);
      this.staffService.getStaffMember(this.staffMemberId()).subscribe({
        next: (member) => {
          this.staffMember.set(member);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load staff member');
        },
      });
    });
  }

  protected requestEdit(): void {
    const member = this.staffMember();
    if (!member) return;
    this.close()();
    this.editRequested.emit(member);
  }
}
