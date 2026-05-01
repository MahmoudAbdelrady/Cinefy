import { Component, inject } from '@angular/core';
import {
  ChartColumn,
  CreditCard,
  Film,
  House,
  LayoutDashboard,
  LucideAngularModule,
  LucideIconData,
  Settings,
  Users,
  X,
} from 'lucide-angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../services';

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
  protected sidebarService = inject(SidebarService);
  protected XIcon = X;

  protected readonly tabs: SidebarTab[] = [
    { label: 'Dashboard', icon: House, path: '/' },
    { label: 'Halls', icon: LayoutDashboard, path: '/halls' },
    { label: 'Movies', icon: Film, path: '/movies' },
    { label: 'Statistics', icon: ChartColumn, path: '/statistics' },
    { label: 'Payment', icon: CreditCard, path: '/payment' },
    { label: 'Staff', icon: Users, path: '/staff' },
  ];

  protected readonly settingsTab: SidebarTab = {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  };
}
