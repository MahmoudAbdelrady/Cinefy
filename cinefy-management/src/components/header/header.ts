import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LogOut, LucideAngularModule, LucideIconData, Menu, User } from 'lucide-angular';
import { CalendarIcon, ChevronDownIcon } from '../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import { AuthService, HeaderActionsService, SidebarService, ToastService } from '../../services';

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
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: User, label: 'Profile', action: () => this.router.navigateByUrl('/profile') },
    { icon: LogOut, label: 'Logout', action: () => this.logout() },
  ];

  protected headerActionsTemplate = this.headerActionsService.template;
  protected currentDate = new Date();

  protected openSidebar() {
    this.sidebarService.open();
  }

  private logout() {
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl('/login'),
        error: () => this.toastService.error('Failed to log out'),
      });
  }
}
