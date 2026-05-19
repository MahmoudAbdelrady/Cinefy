import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LogOut, LucideAngularModule, LucideIconData, Menu, User } from 'lucide-angular';
import { CalendarIcon, ChevronDownIcon } from '../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import { HeaderActionsService, SidebarService } from '../../services';

interface DropDownMenuItem {
  icon: LucideIconData;
  label: string;
  code: string;
}

@Component({
  selector: 'header-component',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpMenu,
    NgpMenuItem,
    NgpMenuTrigger,
    DatePipe,
    NgTemplateOutlet,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  protected readonly icons = {
    CalendarIcon,
    ChevronDownIcon,
    MenuIcon: Menu,
  };

  private sidebarService = inject(SidebarService);
  private headerActionsService = inject(HeaderActionsService);

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: User, label: 'Profile', code: 'profile' },
    { icon: LogOut, label: 'Logout', code: 'logout' },
  ];

  protected headerActionsTemplate = this.headerActionsService.template;
  protected currentDate = new Date();

  protected openSidebar() {
    this.sidebarService.open();
  }
}
