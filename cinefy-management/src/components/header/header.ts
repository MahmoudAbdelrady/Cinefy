import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  Calendar,
  ChevronDown,
  LucideAngularModule,
  LucideIconData,
  LogOut,
  Menu,
  User,
} from 'lucide-angular';
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
  protected ChevronDownIcon = ChevronDown;
  protected CalendarIcon = Calendar;
  protected MenuIcon = Menu;

  private sidebarService = inject(SidebarService);
  private headerActionsService = inject(HeaderActionsService);

  protected headerActionsTemplate = this.headerActionsService.template;
  protected currentDate = new Date();

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: User, label: 'Profile', code: 'profile' },
    { icon: LogOut, label: 'Logout', code: 'logout' },
  ];

  protected openSidebar() {
    this.sidebarService.open();
  }
}
