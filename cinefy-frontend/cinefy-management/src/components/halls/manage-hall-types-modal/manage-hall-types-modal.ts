import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Popover } from 'primeng/popover';
import { Tooltip } from 'primeng/tooltip';
import {
  CinefyDialog,
  CinefyLoadingSpinner,
  CinefyInput,
  CinefyEmptyState,
  CinefyErrorState,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { HallsService } from '../../../services';
import { HallType } from '../../../shared/types';
import { RESOURCE_NAME_PATTERN } from '../../../shared/validation';

@Component({
  selector: 'manage-hall-types-modal',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    Popover,
    Tooltip,
    CinefyDialog,
    CinefyLoadingSpinner,
    CinefyInput,
    CinefyEmptyState,
    CinefyErrorState,
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
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly deleteConfirm = viewChild.required(Popover);

  readonly closed = output<void>();

  protected readonly typeToDelete = signal<HallType | null>(null);

  protected readonly hallTypes = signal<HallType[]>([]);
  protected readonly loadingTypes = signal(true);
  protected readonly loadTypesError = signal(false);
  protected readonly editingTypeId = signal<string | null>(null);
  protected readonly savingTypeId = signal<string | null>(null);
  protected readonly deletingTypeIds = signal<Set<string>>(new Set());
  protected readonly addingType = signal(false);
  protected readonly showNewTypeForm = signal(false);

  protected readonly newTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(30),
        Validators.pattern(RESOURCE_NAME_PATTERN),
      ],
    }),
  });

  protected readonly editTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(30),
        Validators.pattern(RESOURCE_NAME_PATTERN),
      ],
    }),
  });

  protected readonly nameErrorMessages: Record<string, string> = {
    required: 'Hall type name is required',
    maxlength: 'Hall type name must not exceed 30 characters',
    pattern:
      'Name may only contain letters, numbers, single spaces, and hyphens, with no leading or trailing spaces',
  };

  constructor() {
    afterNextRender(() => this.loadHallTypes());
  }

  private loadHallTypes() {
    this.loadingTypes.set(true);
    this.loadTypesError.set(false);
    this.hallsService
      .getHallTypes(skipServerErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (types) => {
          this.hallTypes.set(types);
          this.loadingTypes.set(false);
        },
        error: () => {
          this.loadTypesError.set(true);
          this.loadingTypes.set(false);
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.hallTypes.update((types) => types.map((t) => (t.id === updated.id ? updated : t)));
          this.editingTypeId.set(null);
          this.savingTypeId.set(null);
          this.toastService.success('Hall type updated');
        },
        error: () => this.savingTypeId.set(null),
      });
  }

  protected cancelEditType() {
    this.editingTypeId.set(null);
    this.editTypeForm.controls.name.reset();
  }

  protected openDeleteConfirm(event: Event, type: HallType) {
    this.typeToDelete.set(type);
    this.deleteConfirm().toggle(event);
  }

  protected closeDeleteConfirm() {
    this.deleteConfirm().hide();
    this.typeToDelete.set(null);
  }

  protected isDeleting(id: string): boolean {
    return this.deletingTypeIds().has(id);
  }

  protected deleteType(type: HallType) {
    if (this.isDeleting(type.id!)) return;
    this.markDeleting(type.id!, true);
    this.hallsService
      .deleteHallType(type.id!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.hallTypes.update((types) => types.filter((t) => t.id !== type.id));
          this.markDeleting(type.id!, false);
          this.closeDeleteConfirm();
          this.toastService.success('Hall type deleted');
        },
        error: () => this.markDeleting(type.id!, false),
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.hallTypes.update((types) => [...types, created]);
          this.newTypeForm.controls.name.reset();
          this.addingType.set(false);
          this.showNewTypeForm.set(false);
          this.toastService.success('Hall type created');
        },
        error: () => this.addingType.set(false),
      });
  }

  private markDeleting(id: string, isDeleting: boolean): void {
    this.deletingTypeIds.update((current) => {
      const next = new Set(current);
      if (isDeleting) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
