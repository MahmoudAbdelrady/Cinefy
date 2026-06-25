import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import { NgpButton } from 'ng-primitives/button';
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
import type { CurrentUser } from '../../shared/types';

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
    NgpButton,
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

  protected readonly isAuthenticatedLoading = signal(true);
  protected readonly currentUserLoading = signal(true);

  protected readonly isAuthenticated = signal(false);
  protected readonly currentUser = signal<CurrentUser | null>(null);
  protected readonly userDisplayName = computed(() => this.currentUser()?.fullName ?? '');

  constructor() {
    afterNextRender(() => {
      this.authService
        .isAuthenticated()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (authenticated) => {
            this.isAuthenticated.set(authenticated);
            this.isAuthenticatedLoading.set(false);
            if (authenticated) {
              this.loadCurrentUser();
            } else {
              this.currentUserLoading.set(false);
            }
          },
        });
    });
  }

  private loadCurrentUser(): void {
    this.clientService
      .getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.currentUserLoading.set(false);
        },
        error: () => {
          this.currentUserLoading.set(false);
        },
      });
  }

  protected logout(): void {
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.router.navigateByUrl('/') });
  }
}
