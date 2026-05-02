import { Component, computed, input, model, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Check, CircleQuestionMark, LucideAngularModule } from 'lucide-angular';

export interface StepperStep {
  label: string;
  description?: string;
  content: TemplateRef<unknown>;
}

export interface StepperNoteTip {
  title: string;
  content: string | TemplateRef<unknown>;
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

  protected readonly noteTipText = computed(() => {
    const c = this.noteTip()?.content;
    return typeof c === 'string' ? c : null;
  });

  protected readonly noteTipTpl = computed(() => {
    const c = this.noteTip()?.content;
    return c instanceof TemplateRef ? c : null;
  });
}
