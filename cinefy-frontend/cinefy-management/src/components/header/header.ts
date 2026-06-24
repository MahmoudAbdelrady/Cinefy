import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, inject, Signal, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import { ChevronDownIcon, LogoutIcon, MenuIcon, UserIcon } from '../../shared/icons';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { AuthService, HeaderActionsService, SidebarService, StaffService } from '../../services';
import { USER_POSITION_LABELS } from '../../shared/types';

interface DropDownMenuItem {
  icon: LucideIcon;
  label: string;
  action: () => void;
  loading?: Signal<boolean>;
}

@Component({
  selector: 'header-component',
  imports: [
    LucideDynamicIcon,
    NgpMenu,
    NgpMenuItem,
    NgpMenuTrigger,
    NgTemplateOutlet,
    LoadingSpinnerComponent,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  protected readonly icons = {
    ChevronDownIcon,
    MenuIcon,
  };

  private readonly sidebarService = inject(SidebarService);
  private readonly headerActionsService = inject(HeaderActionsService);
  private readonly authService = inject(AuthService);
  private readonly staffService = inject(StaffService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loggingOut = signal(false);

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: UserIcon, label: 'Profile', action: () => this.router.navigateByUrl('/profile') },
    {
      icon: LogoutIcon,
      label: 'Logout',
      action: () => this.logout(),
      loading: this.loggingOut,
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

  protected openSidebar() {
    this.sidebarService.open();
  }

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
