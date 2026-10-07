import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CinefyServerUnavailable } from 'cinefy-ui/components';
import { HeaderComponent, SidebarComponent } from '../../components';
import { AuthService } from '../../services';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, CinefyServerUnavailable],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  private readonly authService = inject(AuthService);

  protected readonly serverUnavailable = this.authService.serverUnavailable;

  protected retry(): void {
    window.location.reload();
  }
}
