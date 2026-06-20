import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField } from 'cinefy-ui/components';
import { EMAIL_PATTERN } from '../../../shared/validation';
import { ArrowLeftIcon, ArrowRightIcon, EmailIcon } from '../../../shared/icons';

@Component({
  selector: 'forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, LucideDynamicIcon, InputField],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordPage {
  protected readonly icons = {
    EmailIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
  };

  private readonly router = inject(Router);

  protected readonly forgotForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
  });

  protected onSubmit() {
    if (this.forgotForm.invalid) return;
    this.router.navigateByUrl('/membership/verify');
  }
}
