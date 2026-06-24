import { Component, computed, DestroyRef, inject } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import {
  UserIcon,
  TicketIcon,
  LogoutIcon,
  LoginIcon,
  SignupIcon,
  ClapperboardIcon,
} from '../../shared/icons';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { MyTicketsListComponent } from '../../components';
import { AuthService, ClientService } from '../../services';

interface DropDownMenuItem {
  icon: LucideIcon;
  label: string;
  action: () => void;
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    LucideDynamicIcon,
    NgpMenu,
    NgpMenuItem,
    NgpMenuTrigger,
    NgpDialogTrigger,
    LoadingSpinnerComponent,
    MyTicketsListComponent,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  protected readonly icons = {
    UserIcon,
    TicketIcon,
    LoginIcon,
    SignupIcon,
    ClapperboardIcon,
  };

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly clientService = inject(ClientService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentYear = new Date().getFullYear();

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: UserIcon, label: 'Profile', action: () => this.router.navigateByUrl('/profile') },
    { icon: LogoutIcon, label: 'Logout', action: () => this.logout() },
  ];

  protected readonly isAuthenticated = rxResource({
    stream: () => this.authService.isAuthenticated(),
  });

  protected readonly currentUser = rxResource({
    params: () => (this.isAuthenticated.value() ? {} : undefined),
    stream: () => this.clientService.getCurrentUser(),
  });
  protected readonly userDisplayName = computed(() => this.currentUser.value()?.fullName ?? '');

  protected logout(): void {
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.router.navigateByUrl('/') });
  }
}
