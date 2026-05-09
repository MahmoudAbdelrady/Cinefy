import { Component } from '@angular/core';
import { Check, LucideAngularModule, X, Zap } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import type { PaymentMethodTestResult } from '../../../../shared/types';

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

  protected readonly testResult: PaymentMethodTestResult = {
    id: 'mock',
    testStatus: 'FAILURE',
    testFailureReason: 'Server returned 401',
  };
}
