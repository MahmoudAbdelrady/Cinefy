import { Component, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpTabButton, NgpTabList, NgpTabPanel, NgpTabset } from 'ng-primitives/tabs';
import {
  PersonalDetailsComponent,
  ProfileBillingComponent,
  ProfileHistoryComponent,
  ProfilePasswordComponent,
} from '../../components';
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
    ProfileBillingComponent,
    ProfileHistoryComponent,
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

  protected readonly defaultTab = 'account';

  private readonly visitedTabs = signal<ReadonlySet<string>>(new Set([this.defaultTab]));

  protected hasVisited(tab: string): boolean {
    return this.visitedTabs().has(tab);
  }

  protected onTabChange(tab: string | undefined): void {
    if (!tab || this.visitedTabs().has(tab)) return;
    this.visitedTabs.update((visited) => new Set(visited).add(tab));
  }
}
