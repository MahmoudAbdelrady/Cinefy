import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ChartColumn,
  CreditCard,
  Film,
  House,
  LayoutDashboard,
  LucideAngularModule,
  LucideIconData,
  Users,
  X,
} from 'lucide-angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService, StaffService } from '../../services';
import { canAccessRoute } from '../../shared/access';

interface SidebarTab {
  label: string;
  icon: LucideIconData;
  path: string;
}

@Component({
  selector: 'sidebar-component',
  imports: [LucideAngularModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  protected readonly icons = {
    XIcon: X,
  };
  protected sidebarService = inject(SidebarService);
  private readonly staffService = inject(StaffService);

  private static readonly ALL_TABS: SidebarTab[] = [
    { label: 'Dashboard', icon: House, path: '/' },
    { label: 'Halls', icon: LayoutDashboard, path: '/halls' },
    { label: 'Movies', icon: Film, path: '/movies' },
    { label: 'Statistics', icon: ChartColumn, path: '/statistics' },
    { label: 'Payment', icon: CreditCard, path: '/payment' },
    { label: 'Staff', icon: Users, path: '/staff' },
  ];

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());

  protected readonly tabs = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return SidebarComponent.ALL_TABS.filter((tab) => canAccessRoute(tab.path, user.position));
  });
}
