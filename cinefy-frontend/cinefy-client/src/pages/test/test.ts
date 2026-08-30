import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CinefySwitch } from 'cinefy-ui/components';

@Component({
  selector: 'test-page',
  imports: [CinefySwitch],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly notifications = new FormControl(false, { nonNullable: true });
  protected readonly compact = new FormControl(true, { nonNullable: true });
  protected readonly highlight = new FormControl(false, { nonNullable: true });
  protected readonly locked = new FormControl(
    { value: true, disabled: true },
    { nonNullable: true },
  );
}
