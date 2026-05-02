import { Component, input, model, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Check, CircleQuestionMark, LucideAngularModule } from 'lucide-angular';

export interface StepperStep {
  label: string;
  description?: string;
  content: TemplateRef<unknown>;
}

export interface StepperNoteTip {
  title: string;
  content: string;
}

@Component({
  selector: 'stepper',
  imports: [NgTemplateOutlet, LucideAngularModule],
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
})
export class Stepper {
  protected readonly Check = Check;
  protected readonly CircleQuestionMark = CircleQuestionMark;

  readonly steps = input.required<StepperStep[]>();
  readonly noteTip = input<StepperNoteTip | null>(null);
  readonly currentStep = model(0);
}
