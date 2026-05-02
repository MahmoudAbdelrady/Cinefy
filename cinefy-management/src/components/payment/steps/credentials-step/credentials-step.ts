import { Component, signal } from '@angular/core';
import { Eye, EyeOff, Info, KeyRound, Lock, LucideAngularModule } from 'lucide-angular';
import { NgpInput } from 'ng-primitives/input';
import { NgpButton } from 'ng-primitives/button';

@Component({
  selector: 'credentials-step',
  imports: [NgpInput, NgpButton, LucideAngularModule],
  templateUrl: './credentials-step.html',
  styleUrl: './credentials-step.scss',
})
export class CredentialsStep {
  protected readonly LockIcon = Lock;
  protected readonly KeyIcon = KeyRound;
  protected readonly InfoIcon = Info;
  protected readonly EyeIcon = Eye;
  protected readonly EyeOffIcon = EyeOff;

  protected readonly showApiKey = signal(false);
  protected readonly showHmac = signal(false);

  protected toggleApiKey() {
    this.showApiKey.update((v) => !v);
  }

  protected toggleHmac() {
    this.showHmac.update((v) => !v);
  }
}
