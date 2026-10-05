import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InfoIcon } from '../../shared/icons';

@Component({
  selector: 'privacy-policy-page',
  imports: [RouterLink, LucideDynamicIcon],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicyPage {
  protected readonly icons = {
    InfoIcon,
  };
}
