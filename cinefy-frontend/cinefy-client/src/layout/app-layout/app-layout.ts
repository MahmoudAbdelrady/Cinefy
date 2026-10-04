import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { UserIcon, TicketIcon, LogoutIcon, LoginIcon, SignupIcon } from '../../shared/icons';
import { CinefyMenu, CinefyLoadingSpinner, CinefyServerUnavailable } from 'cinefy-ui/components';
import type { CinefyMenuGroup } from 'cinefy-ui/types';
import { MyTicketsListComponent } from '../../components';
import { AuthService, ClientService } from '../../services';
import type { CurrentUser } from '../../shared/types';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    CinefyLoadingSpinner,
    MyTicketsListComponent,
    CinefyMenu,
    CinefyServerUnavailable,
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
  };

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly clientService = inject(ClientService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentYear = new Date().getFullYear();

  protected readonly serverUnavailable = this.authService.serverUnavailable;

  protected readonly myTicketsVisible = signal(false);

  protected readonly isAuthenticatedLoading = signal(true);
  protected readonly currentUserLoading = signal(true);
  protected readonly logoutLoading = signal(false);

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
          loading: this.logoutLoading,
        },
      ],
    },
  ];

  protected readonly isAuthenticated = signal(false);
  protected readonly currentUser = signal<CurrentUser | null>(null);
  protected readonly userDisplayName = computed(() => this.currentUser()?.fullName ?? '');

  constructor() {
    afterNextRender(() => {
      this.authService
        .getAuthStatus()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (status) => {
            this.isAuthenticated.set(status === 'AUTHENTICATED');
            this.isAuthenticatedLoading.set(false);
            if (this.isAuthenticated()) {
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

  protected retry(): void {
    window.location.reload();
  }

  protected logout(): void {
    if (this.logoutLoading()) return;
    this.logoutLoading.set(true);
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl('/membership/login'),
        error: () => this.logoutLoading.set(false),
      });
  }
}
