import { afterNextRender, Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CheckIcon,
  DeleteIcon,
  EditIcon,
  LoaderIcon,
  PlusIcon,
  TagIcon,
  WarningIcon,
  XIcon,
} from '../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import {
  ModalComponent,
  LoadingSpinnerComponent,
  InputField,
  EmptyStateComponent,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { HallsService } from '../../../services';
import { HallType } from '../../../shared/types';

function notBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value === 'string' && value.length > 0 && value.trim().length === 0) {
    return { notBlank: true };
  }
  return null;
}

@Component({
  selector: 'manage-hall-types-modal',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    NgpButton,
    NgpPopover,
    NgpPopoverTrigger,
    ModalComponent,
    LoadingSpinnerComponent,
    InputField,
    EmptyStateComponent,
  ],
  templateUrl: './manage-hall-types-modal.html',
  styleUrl: './manage-hall-types-modal.scss',
})
export class ManageHallTypesModalComponent {
  protected readonly icons = {
    CheckIcon,
    DeleteIcon,
    EditIcon,
    PlusIcon,
    WarningIcon,
    XIcon,
    LoaderIcon,
    TagIcon,
  };

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);

  readonly close = input.required<() => void>();

  protected readonly hallTypes = signal<HallType[]>([]);
  protected readonly loadingTypes = signal(true);
  protected readonly editingTypeId = signal<string | null>(null);
  protected readonly savingTypeId = signal<string | null>(null);
  protected readonly deletingTypeId = signal<string | null>(null);
  protected readonly addingType = signal(false);
  protected readonly showNewTypeForm = signal(false);

  protected readonly newTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlankValidator],
    }),
  });

  protected readonly editTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlankValidator],
    }),
  });

  protected readonly nameErrorMessages: Record<string, string> = {
    required: 'Hall Type name is required',
    notBlank: "Hall Type name can't be empty",
  };

  constructor() {
    afterNextRender(() => this.loadHallTypes());
  }

  private loadHallTypes() {
    this.loadingTypes.set(true);
    this.hallsService.getHallTypes().subscribe({
      next: (types) => {
        this.hallTypes.set(types);
        this.loadingTypes.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingTypes.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to load hall types');
      },
    });
  }

  protected startEditingType(type: HallType) {
    this.editingTypeId.set(type.id!);
    this.editTypeForm.controls.name.setValue(type.name);
  }

  protected confirmEditType(type: HallType) {
    if (this.editTypeForm.controls.name.invalid) return;
    this.savingTypeId.set(type.id!);
    this.hallsService
      .updateHallType(type.id!, { name: this.editTypeForm.controls.name.value.trim() })
      .subscribe({
        next: (updated) => {
          this.hallTypes.update((types) => types.map((t) => (t.id === updated.id ? updated : t)));
          this.editingTypeId.set(null);
          this.savingTypeId.set(null);
          this.toastService.success('Hall type updated');
        },
        error: (err: HttpErrorResponse) => {
          this.savingTypeId.set(null);
          this.toastService.error(err.error?.message ?? 'Failed to update hall type');
        },
      });
  }

  protected cancelEditType() {
    this.editingTypeId.set(null);
    this.editTypeForm.controls.name.reset();
  }

  protected deleteType(type: HallType) {
    this.deletingTypeId.set(type.id!);
    this.hallsService.deleteHallType(type.id!).subscribe({
      next: () => {
        this.hallTypes.update((types) => types.filter((t) => t.id !== type.id));
        this.deletingTypeId.set(null);
        this.toastService.success('Hall type deleted');
      },
      error: (err: HttpErrorResponse) => {
        this.deletingTypeId.set(null);
        this.toastService.error(err.error?.message ?? 'Failed to delete hall type');
      },
    });
  }

  protected startAddingType() {
    this.showNewTypeForm.set(true);
    this.newTypeForm.controls.name.reset();
  }

  protected cancelAddType() {
    this.showNewTypeForm.set(false);
    this.newTypeForm.controls.name.reset();
  }

  protected addType() {
    if (this.newTypeForm.controls.name.invalid) return;
    this.addingType.set(true);
    this.hallsService
      .createHallType({ name: this.newTypeForm.controls.name.value.trim() })
      .subscribe({
        next: (created) => {
          this.hallTypes.update((types) => [...types, created]);
          this.newTypeForm.controls.name.reset();
          this.addingType.set(false);
          this.showNewTypeForm.set(false);
          this.toastService.success('Hall type created');
        },
        error: (err: HttpErrorResponse) => {
          this.addingType.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to add hall type');
        },
      });
  }
}
