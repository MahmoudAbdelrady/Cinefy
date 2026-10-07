import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChevronDownIcon, LogoutIcon, UserIcon } from '../../shared/icons';
import { CinefyMenu } from 'cinefy-ui/components';
import { CinefyMenuGroup } from 'cinefy-ui/types';
import { AuthService, HeaderActionsService, StaffService } from '../../services';
import { USER_POSITION_LABELS } from '../../shared/types';
import { DrawerComponent } from '../drawer/drawer';

@Component({
  selector: 'header-component',
  imports: [LucideDynamicIcon, NgTemplateOutlet, CinefyMenu, DrawerComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  protected readonly icons = {
    ChevronDownIcon,
  };

  private readonly headerActionsService = inject(HeaderActionsService);
  private readonly authService = inject(AuthService);
  private readonly staffService = inject(StaffService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loggingOut = signal(false);

  protected readonly userInfoMenuGroups: CinefyMenuGroup[] = [
    {
      items: [
        { icon: UserIcon, label: 'Profile', action: () => this.router.navigateByUrl('/profile') },
      ],
    },
    {
      items: [
        {
          icon: LogoutIcon,
          label: 'Logout',
          action: () => this.logout(),
          loading: this.loggingOut,
        },
      ],
    },
  ];

  protected headerActionsTemplate = this.headerActionsService.template;

  protected readonly currentStaffMember = toSignal(this.staffService.getCurrentStaffMember());
  protected readonly positionLabel = computed(() => {
    const position = this.currentStaffMember()?.position;
    return position ? USER_POSITION_LABELS[position] : '';
  });
  protected readonly initials = computed(() => {
    const user = this.currentStaffMember();
    if (!user) return '';
    return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
  });

  private logout() {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl('/login'),
        error: () => this.loggingOut.set(false),
      });
  }
}
