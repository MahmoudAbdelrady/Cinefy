import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, take } from 'rxjs';
import {
  ProfileIdentityComponent,
  ProfilePasswordComponent,
  ProfilePersonalDetailsComponent,
} from '../../components';
import type { StaffMemberDetail } from '../../shared/types';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { StaffService } from '../../services';
import { CinefyErrorState, CinefyLoadingSpinner } from 'cinefy-ui/components';

@Component({
  selector: 'profile-page',
  imports: [
    CinefyLoadingSpinner,
    CinefyErrorState,
    ProfileIdentityComponent,
    ProfilePersonalDetailsComponent,
    ProfilePasswordComponent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfilePage {
  private readonly staffService = inject(StaffService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly profile = signal<StaffMemberDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

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
        switchMap((current) =>
          this.staffService.getStaffMember(current.id, skipServerErrorToast()),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }
}
