import { Component, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { Drawer } from 'primeng/drawer';
import { MenuIcon } from '../../shared/icons';
import { NavLinksComponent } from '../nav-links/nav-links';
import { SiteBrandComponent } from '../site-brand/site-brand';

@Component({
  selector: 'drawer-component',
  imports: [LucideDynamicIcon, Drawer, NavLinksComponent, SiteBrandComponent],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
})
export class DrawerComponent {
  protected readonly icons = {
    MenuIcon,
  };

  protected readonly isOpen = signal(false);
}
