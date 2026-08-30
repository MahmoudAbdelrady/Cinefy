import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputOtp } from 'primeng/inputotp';

@Component({
  selector: 'test-page',
  imports: [ReactiveFormsModule, InputOtp],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly code = new FormControl('', { nonNullable: true });
  protected readonly pin = new FormControl('', { nonNullable: true });
  protected readonly masked = new FormControl('', { nonNullable: true });
}
