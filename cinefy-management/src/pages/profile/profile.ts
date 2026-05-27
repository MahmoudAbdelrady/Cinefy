import { afterNextRender, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, take } from 'rxjs';
import {
  LoadingSpinnerComponent,
  ProfileIdentityComponent,
  ProfilePasswordComponent,
  ProfilePersonalDetailsComponent,
} from '../../components';
import type { StaffMemberDetail } from '../../shared/types';
import { StaffService, ToastService } from '../../services';

@Component({
  selector: 'profile-page',
  imports: [
    LoadingSpinnerComponent,
    ProfileIdentityComponent,
    ProfilePersonalDetailsComponent,
    ProfilePasswordComponent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfilePage {
  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);

  protected readonly profile = signal<StaffMemberDetail | null>(null);
  protected readonly loading = signal(false);

  constructor() {
    afterNextRender(() => {
      this.loadProfile();
    });
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.staffService
      .getCurrentStaffMember()
      .pipe(
        take(1),
        switchMap((current) => this.staffService.getStaffMember(current.id)),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load profile');
        },
      });
  }
}
