import { Component } from '@angular/core';
import { NgpInput } from 'ng-primitives/input';
import { NgpRadioGroup, NgpRadioItem } from 'ng-primitives/radio';
import { Check, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'identity-step',
  imports: [NgpInput, NgpRadioGroup, NgpRadioItem, LucideAngularModule],
  templateUrl: './identity-step.html',
  styleUrl: './identity-step.scss',
})
export class IdentityStep {
  protected readonly CheckIcon = Check;
}
