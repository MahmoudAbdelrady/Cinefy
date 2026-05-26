import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LogOut, LucideAngularModule, LucideIconData, Menu, User } from 'lucide-angular';
import { CalendarIcon, ChevronDownIcon } from '../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import {
  AuthService,
  HeaderActionsService,
  SidebarService,
  StaffService,
  ToastService,
} from '../../services';
import { USER_POSITION_LABELS } from '../../shared/types';

interface DropDownMenuItem {
  icon: LucideIconData;
  label: string;
  action: () => void;
}

@Component({
  selector: 'header-component',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpMenu,
    NgpMenuItem,
    NgpMenuTrigger,
    DatePipe,
    NgTemplateOutlet,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  protected readonly icons = {
    CalendarIcon,
    ChevronDownIcon,
    MenuIcon: Menu,
  };

  private readonly sidebarService = inject(SidebarService);
  private readonly headerActionsService = inject(HeaderActionsService);
  private readonly authService = inject(AuthService);
  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: User, label: 'Profile', action: () => this.router.navigateByUrl('/profile') },
    { icon: LogOut, label: 'Logout', action: () => this.logout() },
  ];

  protected headerActionsTemplate = this.headerActionsService.template;
  protected currentDate = new Date();

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
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.staffService.clearCurrentStaffMember();
          this.router.navigateByUrl('/login');
        },
        error: () => this.toastService.error('Failed to log out'),
      });
  }
}
