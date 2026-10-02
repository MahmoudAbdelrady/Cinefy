import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CheckIcon,
  DeleteIcon,
  EditIcon,
  TagIcon,
  WarningIcon,
  XIcon,
} from '../../../shared/icons';
import { Popover } from 'primeng/popover';
import { Tooltip } from 'primeng/tooltip';
import {
  CinefyLoadingSpinner,
  CinefyInput,
  CinefyEmptyState,
  CinefyErrorState,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { HallsService } from '../../../services';
import { HallType } from '../../../shared/types';
import { createHallTypeForm, HALL_TYPE_NAME_ERROR_MESSAGES } from '../hall-type-form';

@Component({
  selector: 'hall-types-list',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    Popover,
    Tooltip,
    CinefyLoadingSpinner,
    CinefyInput,
    CinefyEmptyState,
    CinefyErrorState,
  ],
  templateUrl: './hall-types-list.html',
  styleUrl: './hall-types-list.scss',
})
export class HallTypesListComponent {
  protected readonly icons = {
    CheckIcon,
    DeleteIcon,
    EditIcon,
    WarningIcon,
    XIcon,
    TagIcon,
  };

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly deleteConfirm = viewChild.required(Popover);

  protected readonly nameErrorMessages = HALL_TYPE_NAME_ERROR_MESSAGES;

  readonly loadTypesError = signal(false);

  protected readonly typeToDelete = signal<HallType | null>(null);

  protected readonly hallTypes = signal<HallType[]>([]);
  protected readonly loadingTypes = signal(true);
  protected readonly editingTypeId = signal<string | null>(null);
  protected readonly savingTypeId = signal<string | null>(null);
  protected readonly deletingTypeIds = signal<Set<string>>(new Set());

  protected readonly editTypeForm = createHallTypeForm();

  constructor() {
    effect(() => {
      if (this.savingTypeId()) {
        this.editTypeForm.disable({ emitEvent: false });
      } else {
        this.editTypeForm.enable({ emitEvent: false });
      }
    });

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

  add(type: HallType) {
    this.hallTypes.update((types) => [...types, type]);
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
    if (this.savingTypeId()) return;
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
