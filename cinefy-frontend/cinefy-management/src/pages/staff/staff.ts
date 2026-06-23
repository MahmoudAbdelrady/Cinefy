import { Component, DestroyRef, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { UserPlusIcon } from '../../shared/icons';
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
    LucideDynamicIcon,
    NgpDialogTrigger,
    StaffListComponent,
    ManageStaffModalComponent,
    StaffPositionCoverageComponent,
  ],
  templateUrl: './staff.html',
  styleUrl: './staff.scss',
})
export class StaffPage implements OnInit {
  protected readonly icons = {
    UserPlusIcon,
  };

  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');
  protected staffList = viewChild.required(StaffListComponent);
  protected staffPositionCoverage = viewChild.required(StaffPositionCoverageComponent);

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
