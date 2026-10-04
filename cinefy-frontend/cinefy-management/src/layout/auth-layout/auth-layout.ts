import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CinefyServerUnavailable } from 'cinefy-ui/components';
import { AuthService } from '../../services';

@Component({
  selector: 'auth-layout',
  imports: [RouterOutlet, RouterLink, CinefyServerUnavailable],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  private readonly authService = inject(AuthService);

  protected readonly currentYear = new Date().getFullYear();

  protected readonly serverUnavailable = this.authService.serverUnavailable;

  protected retry(): void {
    window.location.reload();
  }
}
