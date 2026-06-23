import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import {
  ChartColumnIcon,
  CreditCardIcon,
  ClapperboardIcon,
  HouseIcon,
  LayoutIcon,
  UsersIcon,
  XIcon,
} from '../../shared/icons';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService, StaffService } from '../../services';
import { canAccessRoute } from '../../shared/access';

interface SidebarTab {
  label: string;
  icon: LucideIcon;
  path: string;
}

const ALL_TABS: SidebarTab[] = [
  { label: 'Dashboard', icon: HouseIcon, path: '/' },
  { label: 'Halls', icon: LayoutIcon, path: '/halls' },
  { label: 'Movies', icon: ClapperboardIcon, path: '/movies' },
  { label: 'Statistics', icon: ChartColumnIcon, path: '/statistics' },
  { label: 'Payment', icon: CreditCardIcon, path: '/payment' },
  { label: 'Staff', icon: UsersIcon, path: '/staff' },
];

@Component({
  selector: 'sidebar-component',
  imports: [LucideDynamicIcon, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  protected readonly icons = {
    XIcon,
  };
  protected sidebarService = inject(SidebarService);
  private readonly staffService = inject(StaffService);

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());

  protected readonly tabs = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return ALL_TABS.filter((tab) => canAccessRoute(tab.path, user.position));
  });
}
