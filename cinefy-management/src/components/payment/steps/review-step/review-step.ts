import { Component } from '@angular/core';
import { Check, CreditCard, LucideAngularModule, Sparkles } from 'lucide-angular';

@Component({
  selector: 'review-step',
  imports: [LucideAngularModule],
  templateUrl: './review-step.html',
  styleUrl: './review-step.scss',
})
export class ReviewStep {
  protected readonly CreditCardIcon = CreditCard;
  protected readonly SparklesIcon = Sparkles;
  protected readonly CheckIcon = Check;
}
