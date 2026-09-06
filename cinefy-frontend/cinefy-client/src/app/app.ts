import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CinefyToast } from 'cinefy-ui/components';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CinefyToast],
  template: '<router-outlet /><cui-toast />',
})
export class App {}
