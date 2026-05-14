import { Component, DestroyRef, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { LucideAngularModule, UserPlus } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { HeaderActionsService } from '../../services';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  ManageStaffModalComponent,
  StaffListComponent,
  StaffPositionCoverageComponent,
} from '../../components';

@Component({
  selector: 'staff-page',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    StaffListComponent,
    ManageStaffModalComponent,
    StaffPositionCoverageComponent,
  ],
  templateUrl: './staff.html',
  styleUrl: './staff.scss',
})
export class StaffPage implements OnInit {
  protected readonly UserPlusIcon = UserPlus;

  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
