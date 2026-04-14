import { Component, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Check,
  Loader,
  LucideAngularModule,
  SquarePen,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { ModalComponent } from '../../modal/modal';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { HallsService, ToastService } from '../../../services';
import { HallType } from '../../../shared/types';

@Component({
  selector: 'manage-hall-types-modal',
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    NgpButton,
    NgpPopover,
    NgpPopoverTrigger,
    ModalComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './manage-hall-types-modal.html',
  styleUrl: './manage-hall-types-modal.scss',
})
export class ManageHallTypesModalComponent implements OnInit {
  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);

  readonly close = input.required<() => void>();

  protected readonly EditIcon = SquarePen;
  protected readonly DeleteIcon = Trash2;
  protected readonly CheckIcon = Check;
  protected readonly XIcon = X;
  protected readonly WarningIcon = TriangleAlert;
  protected readonly LoaderIcon = Loader;

  protected readonly hallTypes = signal<HallType[]>([]);
  protected readonly loadingTypes = signal(true);
  protected readonly editingTypeId = signal<string | null>(null);
  protected readonly savingTypeId = signal<string | null>(null);
  protected readonly deletingTypeId = signal<string | null>(null);
  protected readonly addingType = signal(false);

  protected readonly editNameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  protected readonly newTypeControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  ngOnInit() {
    this.loadHallTypes();
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
    this.editNameControl.setValue(type.name);
  }

  protected confirmEditType(type: HallType) {
    if (this.editNameControl.invalid) return;
    this.savingTypeId.set(type.id!);
    this.hallsService
      .updateHallType(type.id!, { name: this.editNameControl.value.trim() })
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
    this.editNameControl.reset();
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

  protected addType() {
    if (this.newTypeControl.invalid) return;
    this.addingType.set(true);
    this.hallsService.createHallType({ name: this.newTypeControl.value.trim() }).subscribe({
      next: (created) => {
        this.hallTypes.update((types) => [...types, created]);
        this.newTypeControl.reset();
        this.addingType.set(false);
        this.toastService.success('Hall type added');
      },
      error: (err: HttpErrorResponse) => {
        this.addingType.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to add hall type');
      },
    });
  }

  protected onEditTypeKeydown(event: KeyboardEvent, type: HallType) {
    if (event.key === 'Enter') {
      this.confirmEditType(type);
    } else if (event.key === 'Escape') {
      this.cancelEditType();
    }
  }
}
