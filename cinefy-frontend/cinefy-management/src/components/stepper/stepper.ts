import { Component, computed, input, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { CheckIcon, CircleQuestionIcon } from '../../shared/icons';
import { HelpHint } from '../help-hint/help-hint';

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
  imports: [NgTemplateOutlet, LucideDynamicIcon, HelpHint],
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
})
export class Stepper {
  protected readonly CheckIcon = CheckIcon;
  protected readonly CircleQuestionIcon = CircleQuestionIcon;

  readonly steps = input.required<StepperStep[]>();
  readonly noteTip = input<StepperNoteTip | null>(null);
  readonly currentStep = input.required<number>();

  protected readonly noteTipText = computed(() => {
    const c = this.noteTip()?.content;
    return typeof c === 'string' ? c : null;
  });

  protected readonly noteTipTpl = computed(() => {
    const c = this.noteTip()?.content;
    return c instanceof TemplateRef ? c : null;
  });
}
