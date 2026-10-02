import { Component, DestroyRef, effect, inject, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { CheckIcon, PlusIcon, TagIcon, XIcon } from '../../../shared/icons';
import { Tooltip } from 'primeng/tooltip';
import { CinefyDialog, CinefyLoadingSpinner, CinefyInput } from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { HallsService } from '../../../services';
import { HallTypesListComponent } from '../hall-types-list/hall-types-list';
import { createHallTypeForm, HALL_TYPE_NAME_ERROR_MESSAGES } from '../hall-type-form';

@Component({
  selector: 'manage-hall-types-modal',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    Tooltip,
    CinefyDialog,
    CinefyLoadingSpinner,
    CinefyInput,
    HallTypesListComponent,
  ],
  templateUrl: './manage-hall-types-modal.html',
  styleUrl: './manage-hall-types-modal.scss',
})
export class ManageHallTypesModalComponent {
  protected readonly icons = {
    CheckIcon,
    PlusIcon,
    XIcon,
    TagIcon,
  };

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly typesList = viewChild.required(HallTypesListComponent);

  protected readonly nameErrorMessages = HALL_TYPE_NAME_ERROR_MESSAGES;

  readonly closed = output<void>();

  protected readonly addingType = signal(false);
  protected readonly showNewTypeForm = signal(false);

  protected readonly newTypeForm = createHallTypeForm();

  constructor() {
    effect(() => {
      if (this.addingType()) {
        this.newTypeForm.disable({ emitEvent: false });
      } else {
        this.newTypeForm.enable({ emitEvent: false });
      }
    });
  }

  protected startAddingType() {
    this.showNewTypeForm.set(true);
    this.newTypeForm.controls.name.reset();
  }

  protected cancelAddType() {
    if (this.addingType()) return;
    this.showNewTypeForm.set(false);
    this.newTypeForm.controls.name.reset();
  }

  protected addType() {
    if (this.newTypeForm.controls.name.invalid) return;
    this.addingType.set(true);
    this.hallsService
      .createHallType({ name: this.newTypeForm.controls.name.value.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.typesList().add(created);
          this.newTypeForm.controls.name.reset();
          this.addingType.set(false);
          this.showNewTypeForm.set(false);
          this.toastService.success('Hall type created');
        },
        error: () => this.addingType.set(false),
      });
  }
}
