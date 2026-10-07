import { Component, computed, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import {
  ChartColumnIcon,
  CreditCardIcon,
  ClapperboardIcon,
  HouseIcon,
  LayoutIcon,
  UsersIcon,
} from '../../shared/icons';
import { StaffService } from '../../services';
import { canAccessRoute } from '../../shared/access';

interface NavTab {
  label: string;
  icon: LucideIcon;
  path: string;
}

const ALL_TABS: NavTab[] = [
  { label: 'Dashboard', icon: HouseIcon, path: '/' },
  { label: 'Halls', icon: LayoutIcon, path: '/halls' },
  { label: 'Movies', icon: ClapperboardIcon, path: '/movies' },
  { label: 'Statistics', icon: ChartColumnIcon, path: '/statistics' },
  { label: 'Payment', icon: CreditCardIcon, path: '/payment' },
  { label: 'Staff', icon: UsersIcon, path: '/staff' },
];

@Component({
  selector: 'nav-links',
  imports: [LucideDynamicIcon, RouterLink, RouterLinkActive],
  templateUrl: './nav-links.html',
  styleUrl: './nav-links.scss',
})
export class NavLinksComponent {
  private readonly staffService = inject(StaffService);

  readonly navigated = output<void>();

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());

  protected readonly tabs = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return ALL_TABS.filter((tab) => canAccessRoute(tab.path, user.position));
  });
}
