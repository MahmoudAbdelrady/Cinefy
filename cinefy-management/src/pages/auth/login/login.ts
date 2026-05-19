import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArrowRight, LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { InputField } from '../../../components/input-field/input-field';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner';
import { AtSignIcon, PasswordIcon } from '../../../shared/icons';

@Component({
  selector: 'login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    NgpButton,
    InputField,
    LoadingSpinnerComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  protected readonly icons = {
    AtSignIcon,
    PasswordIcon,
    ArrowRightIcon: ArrowRight,
  };

  protected readonly submitting = signal(false);

  protected readonly loginForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected onSubmit() {
    if (this.loginForm.invalid || this.submitting()) return;
    this.submitting.set(true);
    setTimeout(() => this.submitting.set(false), 1400);
  }
}
