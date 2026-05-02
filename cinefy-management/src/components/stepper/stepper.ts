import { Component, input, signal, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Check, CircleQuestionMark, LucideAngularModule } from 'lucide-angular';

export interface StepperStepContext {
  $implicit: number;
  goNext: () => void;
}

export interface StepperStep {
  label: string;
  description?: string;
  content: TemplateRef<StepperStepContext>;
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
  protected readonly currentStep = signal(0);

  protected goNext = () => {
    this.currentStep.update((i) => Math.min(i + 1, this.steps().length - 1));
  };
}
