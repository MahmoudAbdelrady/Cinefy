import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { InputOtp } from 'cinefy-ui/components';

@Component({
  selector: 'test-page',
  imports: [InputOtp],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly code = new FormControl('', { nonNullable: true });
  protected readonly pin = new FormControl('', { nonNullable: true });
  protected readonly required = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(6)],
  });
}
