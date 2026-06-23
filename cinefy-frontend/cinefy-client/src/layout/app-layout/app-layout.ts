import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import { UserIcon, TicketIcon, LogoutIcon, ClapperboardIcon } from '../../shared/icons';
import { MyTicketsListComponent } from '../../components';

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
    NgpMenu,
    NgpMenuItem,
    NgpMenuTrigger,
    NgpDialogTrigger,
    MyTicketsListComponent,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  protected readonly icons = {
    UserIcon,
    TicketIcon,
    ClapperboardIcon,
  };

  private readonly router = inject(Router);

  protected readonly currentYear = new Date().getFullYear();

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: UserIcon, label: 'Profile', action: () => this.router.navigateByUrl('/profile') },
    { icon: LogoutIcon, label: 'Logout', action: () => {} },
  ];
}
