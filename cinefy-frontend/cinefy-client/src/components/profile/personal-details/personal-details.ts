import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { PhoneFormatPipe } from 'cinefy-ui/pipes';
import { ClientService } from '../../../services';
import { EmailIcon, PhoneIcon, UserIcon } from '../../../shared/icons';
import type { CurrentUser } from '../../../shared/types';

@Component({
  selector: 'personal-details',
  imports: [LucideDynamicIcon, LoadingSpinnerComponent, PhoneFormatPipe],
  templateUrl: './personal-details.html',
  styleUrl: './personal-details.scss',
})
export class PersonalDetailsComponent {
  protected readonly icons = {
    UserIcon,
    EmailIcon,
    PhoneIcon,
  };

  private readonly clientService = inject(ClientService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser = signal<CurrentUser | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    afterNextRender(() => this.loadCurrentUser());
  }

  private loadCurrentUser(): void {
    this.clientService
      .getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
