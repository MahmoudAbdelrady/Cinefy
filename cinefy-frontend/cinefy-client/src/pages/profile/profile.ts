import { Component } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpTabButton, NgpTabList, NgpTabPanel, NgpTabset } from 'ng-primitives/tabs';
import { PersonalDetailsComponent, ProfilePasswordComponent } from '../../components';
import { CreditCardIcon, TicketIcon, UserIcon } from '../../shared/icons';

@Component({
  selector: 'profile-page',
  imports: [
    LucideDynamicIcon,
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    NgpTabPanel,
    PersonalDetailsComponent,
    ProfilePasswordComponent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfilePage {
  protected readonly icons = {
    UserIcon,
    CreditCardIcon,
    TicketIcon,
  };
}
