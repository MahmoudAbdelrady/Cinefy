import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { ClapperboardIcon } from '../../shared/icons';

@Component({
  selector: 'auth-layout',
  imports: [RouterOutlet, RouterLink, LucideDynamicIcon],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  protected readonly icons = {
    ClapperboardIcon,
  };
}
