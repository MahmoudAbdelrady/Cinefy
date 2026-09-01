import { Component, signal, viewChild } from '@angular/core';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

import {
  EllipsisIcon,
  ExternalLinkIcon,
  LogoutIcon,
  SettingsIcon,
  UserIcon,
} from '../../shared/icons';

interface DemoMenuItem extends MenuItem {
  lucideIcon?: LucideIcon;
  items?: DemoMenuItem[];
}

@Component({
  selector: 'test-page',
  imports: [Menu, LucideDynamicIcon],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly icons = {
    EllipsisIcon,
  };

  private readonly popupMenu = viewChild.required<Menu>('popupMenu');

  protected readonly lastAction = signal<string | null>(null);

  protected readonly menuItems: DemoMenuItem[] = [
    {
      label: 'Account',
      items: [
        {
          label: 'Profile',
          lucideIcon: UserIcon,
          command: () => this.lastAction.set('Profile'),
        },
        {
          label: 'Settings',
          lucideIcon: SettingsIcon,
          command: () => this.lastAction.set('Settings'),
        },
      ],
    },
    { separator: true },
    {
      label: 'Session',
      items: [
        {
          label: 'Documentation',
          lucideIcon: ExternalLinkIcon,
          url: 'https://primeng.org/menu',
          target: '_blank',
        },
        {
          label: 'Sign out',
          lucideIcon: LogoutIcon,
          command: () => this.lastAction.set('Sign out'),
        },
        {
          label: 'Delete account',
          disabled: true,
        },
      ],
    },
  ];

  protected toggleMenu(event: Event): void {
    this.popupMenu().toggle(event);
  }
}
