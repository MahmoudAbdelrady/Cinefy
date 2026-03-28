import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  Calendar,
  ChevronDown,
  Clock,
  Film,
  LayoutTemplate,
  LucideAngularModule,
  LucideIconData,
  LogOut,
  Menu,
  Plus,
  User,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import { SidebarService } from '../../services/sidebar';

interface DropDownMenuItem {
  icon: LucideIconData;
  label: string;
  code: string;
}

@Component({
  selector: 'header-component',
  imports: [LucideAngularModule, NgpButton, NgpMenu, NgpMenuItem, NgpMenuTrigger, DatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  private sidebarService = inject(SidebarService);

  protected currentDate = new Date();
  protected PlusIcon = Plus;
  protected ChevronDownIcon = ChevronDown;
  protected CalendarIcon = Calendar;
  protected MenuIcon = Menu;

  protected readonly quickAddMenuItems: DropDownMenuItem[] = [
    { icon: Film, label: 'Movie', code: 'movie' },
    { icon: LayoutTemplate, label: 'Hall', code: 'hall' },
    { icon: Clock, label: 'Showtime', code: 'showtime' },
  ];

  protected readonly userInfoMenuItems: DropDownMenuItem[] = [
    { icon: User, label: 'Profile', code: 'profile' },
    { icon: LogOut, label: 'Logout', code: 'logout' },
  ];

  protected openSidebar() {
    this.sidebarService.open();
  }
}
