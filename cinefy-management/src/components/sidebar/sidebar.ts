import { Component } from '@angular/core';
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
} from 'lucide-angular';
import { RouterLink } from '@angular/router';

interface SidebarTab {
  label: string;
  icon: LucideIconData;
  path: string;
}

@Component({
  selector: 'sidebar-component',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  protected readonly tabs: SidebarTab[] = [
    { label: 'Dashboard', icon: House, path: '/' },
    { label: 'Halls', icon: LayoutDashboard, path: '/halls' },
    { label: 'Movies', icon: Film, path: '/movies' },
    { label: 'Payment', icon: CreditCard, path: '/payment' },
    { label: 'Statistics', icon: ChartColumn, path: '/statistics' },
    { label: 'Users', icon: Users, path: '/users' },
  ];

  protected readonly settingsTab: SidebarTab = {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  };
}
