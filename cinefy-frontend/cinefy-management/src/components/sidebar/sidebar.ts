import { Component } from '@angular/core';
import { NavLinksComponent } from '../nav-links/nav-links';
import { SiteBrandComponent } from '../site-brand/site-brand';

@Component({
  selector: 'sidebar-component',
  imports: [NavLinksComponent, SiteBrandComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {}
