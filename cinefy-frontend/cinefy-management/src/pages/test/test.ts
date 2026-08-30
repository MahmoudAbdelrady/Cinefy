import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
  selector: 'test-page',
  imports: [FormsModule, ToggleSwitch],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly notifications = signal(false);
}
