import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ClapperboardIcon, LucideAngularModule, LucideIconData } from 'lucide-angular';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import { UserIcon, TicketIcon, LogoutIcon } from '../../shared/icons';

interface DropDownMenuItem {
  icon: LucideIconData;
  label: string;
  action: () => void;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, LucideAngularModule, NgpMenu, NgpMenuItem, NgpMenuTrigger],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  protected readonly icons = {
    UserIcon,
    TicketIcon,
    ClapperboardIcon,
  };

  protected readonly currentYear = new Date().getFullYear();

  private readonly router = inject(Router);

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: UserIcon, label: 'Profile', action: () => this.router.navigateByUrl('/profile') },
    { icon: LogoutIcon, label: 'Logout', action: () => {} },
  ];
}
