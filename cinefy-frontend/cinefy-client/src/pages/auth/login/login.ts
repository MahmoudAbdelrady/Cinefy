import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField } from 'cinefy-ui/components';
import { OAuthButtonsComponent } from '../../../components';
import { EMAIL_PATTERN } from '../../../shared/validation';
import { ArrowRightIcon, EmailIcon, LockIcon } from '../../../shared/icons';

@Component({
  selector: 'login-page',
  imports: [ReactiveFormsModule, RouterLink, LucideDynamicIcon, InputField, OAuthButtonsComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  protected readonly icons = {
    EmailIcon,
    LockIcon,
    ArrowRightIcon,
  };

  private readonly router = inject(Router);

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected onSubmit() {
    if (this.loginForm.invalid) return;
    this.router.navigateByUrl('/');
  }
}
