import { Component, signal, viewChild } from '@angular/core';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { CinefyMenu } from 'cinefy-ui/components';
import { CinefyMenuGroup } from 'cinefy-ui/types';

import {
  DeleteIcon,
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
  imports: [Menu, LucideDynamicIcon, CinefyMenu],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly icons = {
    EllipsisIcon,
  };

  private readonly popupMenu = viewChild.required<Menu>('popupMenu');

  protected readonly lastAction = signal<string | null>(null);
  protected readonly signingOut = signal(false);

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

  protected readonly cuiMenuGroups: CinefyMenuGroup[] = [
    {
      label: 'Account',
      items: [
        {
          icon: UserIcon,
          label: 'Profile',
          action: () => this.lastAction.set('Profile'),
        },
        {
          icon: SettingsIcon,
          label: 'Settings',
          action: () => this.lastAction.set('Settings'),
        },
      ],
    },
    {
      label: 'Session',
      items: [
        {
          icon: ExternalLinkIcon,
          label: 'Documentation',
          action: () => this.lastAction.set('Documentation'),
        },
        {
          icon: LogoutIcon,
          label: 'Sign out',
          action: () => this.signOut(),
          loading: this.signingOut,
        },
      ],
    },
    {
      items: [
        {
          icon: DeleteIcon,
          label: 'Delete account',
          action: () => this.lastAction.set('Delete account'),
          disabled: true,
        },
      ],
    },
  ];

  protected toggleMenu(event: Event): void {
    this.popupMenu().toggle(event);
  }

  private signOut(): void {
    this.lastAction.set('Sign out');
    this.signingOut.set(true);
    setTimeout(() => this.signingOut.set(false), 1500);
  }
}
