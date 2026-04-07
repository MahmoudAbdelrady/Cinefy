import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Check,
  LucideAngularModule,
  SquarePen,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { ModalComponent } from '../../modal/modal';
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

  protected readonly hallTypes = signal<HallType[]>([]);
  protected readonly editingTypeId = signal<string | null>(null);

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
    this.hallsService.getHallTypes().subscribe((types) => this.hallTypes.set(types));
  }

  protected startEditingType(type: HallType) {
    this.editingTypeId.set(type.id!);
    this.editNameControl.setValue(type.name);
  }

  protected confirmEditType(type: HallType) {
    if (this.editNameControl.invalid) return;
    this.hallsService
      .updateHallType(type.id!, { name: this.editNameControl.value.trim() })
      .subscribe({
        next: (updated) => {
          this.hallTypes.update((types) => types.map((t) => (t.id === updated.id ? updated : t)));
          this.editingTypeId.set(null);
          this.toastService.success('Hall type updated');
        },
        error: () => {
          this.loadHallTypes();
          this.toastService.error('Failed to update hall type');
        },
      });
  }

  protected cancelEditType() {
    this.editingTypeId.set(null);
    this.editNameControl.reset();
  }

  protected deleteType(type: HallType) {
    this.hallsService.deleteHallType(type.id!).subscribe({
      next: () => {
        this.hallTypes.update((types) => types.filter((t) => t.id !== type.id));
        this.toastService.success('Hall type deleted');
      },
      error: () => {
        this.loadHallTypes();
        this.toastService.error('Failed to delete hall type');
      },
    });
  }

  protected addType() {
    if (this.newTypeControl.invalid) return;
    this.hallsService.createHallType({ name: this.newTypeControl.value.trim() }).subscribe({
      next: (created) => {
        this.hallTypes.update((types) => [...types, created]);
        this.newTypeControl.reset();
        this.toastService.success('Hall type added');
      },
      error: () => {
        this.loadHallTypes();
        this.toastService.error('Failed to add hall type');
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
