import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  DEFAULT_COUNTRY,
  InputField,
  PhoneInput,
  phoneNumberValidator,
  type PhoneCountryCode,
} from 'cinefy-ui/components';
import { OAuthProvider } from '../../../shared/types';
import { EMAIL_PATTERN, NAME_PATTERN, PASSWORD_PATTERN } from '../../../shared/validation';
import { ArrowRightIcon, EmailIcon, LockIcon, UserIcon } from '../../../shared/icons';

@Component({
  selector: 'signup-page',
  imports: [ReactiveFormsModule, RouterLink, LucideDynamicIcon, InputField, PhoneInput],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignUpPage {
  protected readonly icons = {
    UserIcon,
    EmailIcon,
    LockIcon,
    ArrowRightIcon,
  };

  private readonly router = inject(Router);

  protected readonly signupForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN),
      ],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    phoneCountry: new FormControl<PhoneCountryCode>(DEFAULT_COUNTRY, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PASSWORD_PATTERN)],
    }),
  });

  protected readonly oauthProviders: OAuthProvider[] = [
    {
      label: 'Google',
      code: 'google',
      iconSrc: '/Assets/google-icon-logo.svg',
      authenticate: () => this.authenticateWith('google'),
    },
    {
      label: 'Apple',
      code: 'apple',
      iconSrc: '/Assets/apple-icon-logo.png',
      authenticate: () => this.authenticateWith('apple'),
    },
  ];

  constructor() {
    this.signupForm.controls.phoneNumber.addValidators(
      phoneNumberValidator(this.signupForm.controls.phoneCountry),
    );
  }

  protected onSubmit() {
    if (this.signupForm.invalid) return;
    this.router.navigateByUrl('/membership/verify');
  }

  private authenticateWith(_code: string) {
    // OAuth flow wired later.
  }
}
