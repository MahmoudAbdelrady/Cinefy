import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClapperboardIcon } from '../../shared/icons';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'auth-layout',
  imports: [RouterOutlet, LucideDynamicIcon],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  protected readonly icons = {
    ClapperboardIcon,
  };

  protected readonly currentYear = new Date().getFullYear();
}
