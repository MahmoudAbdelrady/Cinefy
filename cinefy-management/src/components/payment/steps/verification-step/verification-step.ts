import { Component } from '@angular/core';
import { Check, LucideAngularModule, X, Zap } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';

interface TestResult {
  name: string;
  errorMsg?: string;
}

@Component({
  selector: 'verification-step',
  imports: [LucideAngularModule, NgpButton],
  templateUrl: './verification-step.html',
  styleUrl: './verification-step.scss',
})
export class VerificationStep {
  protected readonly ZapIcon = Zap;
  protected readonly CheckIcon = Check;
  protected readonly XIcon = X;

  protected readonly testResults: TestResult[] = [
    { name: 'API key authentication', errorMsg: 'Server returned 401' },
    { name: 'HMAC signature' },
    { name: 'Integration lookup' },
    { name: 'Iframe accessibility' },
  ];
}
