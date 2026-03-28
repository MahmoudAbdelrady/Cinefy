import { Component, DestroyRef, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { LucideAngularModule, Plus, Settings } from 'lucide-angular';
import { HeaderActionsService } from '../../services';
import { NgpButton } from 'ng-primitives/button';
import { HallsStatisticsComponent } from '../../components/halls/halls-statistics/halls-statistics';

@Component({
  selector: 'halls-page',
  imports: [LucideAngularModule, NgpButton, HallsStatisticsComponent],
  templateUrl: './halls.html',
  styleUrl: './halls.scss',
})
export class HallsPage implements OnInit {
  protected SettingsIcon = Settings;
  protected PlusIcon = Plus;

  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  ngOnInit() {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
