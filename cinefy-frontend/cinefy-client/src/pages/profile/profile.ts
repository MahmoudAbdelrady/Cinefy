import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import {
  PersonalDetailsComponent,
  ProfileBillingComponent,
  ProfileHistoryComponent,
  ProfilePasswordComponent,
} from '../../components';
import { CreditCardIcon, TicketIcon, UserIcon } from '../../shared/icons';

type ProfileTab = 'account' | 'billing' | 'bookings';

interface ProfileTabItem {
  label: string;
  value: ProfileTab;
  icon: LucideIcon;
}

const PROFILE_TABS: readonly ProfileTabItem[] = [
  { label: 'Account', value: 'account', icon: UserIcon },
  { label: 'Billing', value: 'billing', icon: CreditCardIcon },
  { label: 'Bookings', value: 'bookings', icon: TicketIcon },
];

const DEFAULT_TAB: ProfileTab = 'account';

@Component({
  selector: 'profile-page',
  imports: [
    LucideDynamicIcon,
    PersonalDetailsComponent,
    ProfilePasswordComponent,
    ProfileBillingComponent,
    ProfileHistoryComponent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfilePage {
  protected readonly tabs = PROFILE_TABS;

  private readonly route = inject(ActivatedRoute);

  private readonly initialTab = this.resolveInitialTab();

  protected readonly activeTab = signal<ProfileTab>(this.initialTab);

  private readonly visitedTabs = signal<ReadonlySet<ProfileTab>>(new Set([this.initialTab]));

  protected hasVisited(tab: ProfileTab): boolean {
    return this.visitedTabs().has(tab);
  }

  protected selectTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    if (this.visitedTabs().has(tab)) return;
    this.visitedTabs.update((visited) => new Set(visited).add(tab));
  }

  private resolveInitialTab(): ProfileTab {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    return PROFILE_TABS.find(({ value }) => value === tab)?.value ?? DEFAULT_TAB;
  }
}
