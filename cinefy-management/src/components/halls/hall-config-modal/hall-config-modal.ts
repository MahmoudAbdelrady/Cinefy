import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  LucideAngularModule,
  Settings,
  Star,
  DollarSign,
  LayoutDashboard,
  SquarePen,
  Eye,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { ModalComponent } from '../../modal/modal';
import { HallType, HallListItem, HallSummary } from '../../../shared/types';
import { HallLayoutEditorComponent } from '../hall-layout-editor/hall-layout-editor';
import { HallsService } from '../../../services';

interface SeatCategoryItem {
  name: string;
  type: 'normal' | 'vip' | 'aisle';
}

@Component({
  selector: 'hall-config-modal',
  imports: [
    NgClass,
    LucideAngularModule,
    NgpButton,
    NgpInput,
    NgpSwitch,
    NgpSwitchThumb,
    ModalComponent,
    HallLayoutEditorComponent,
  ],
  templateUrl: './hall-config-modal.html',
  styleUrl: './hall-config-modal.scss',
})
export class HallConfigModalComponent implements OnInit {
  protected readonly SettingsIcon = Settings;
  protected readonly StarIcon = Star;
  protected readonly DollarSignIcon = DollarSign;
  protected readonly LayoutIcon = LayoutDashboard;
  protected readonly EditIcon = SquarePen;
  protected readonly ViewIcon = Eye;

  private readonly hallsService = inject(HallsService);

  readonly close = input.required<() => void>();
  readonly existingHalls = input.required<HallListItem[]>();
  readonly selectedHall = input<HallSummary | null>(null);
  readonly isEditMode = signal(false);

  readonly hallTypes = signal<HallType[]>([]);

  ngOnInit() {
    this.hallsService.getHallTypes().subscribe((types) => this.hallTypes.set(types));
  }

  protected readonly seatCategoryItems = signal<SeatCategoryItem[]>([
    { name: 'Normal', type: 'normal' },
    { name: 'VIP', type: 'vip' },
    { name: 'Space/Aisle', type: 'aisle' },
  ]);

  protected selectedSeatCategory = signal<SeatCategoryItem>(this.seatCategoryItems()[0]);
  protected supports3D = signal(false);
  protected onSiteOnly = signal(false);

  protected selectSeatCategory(category: SeatCategoryItem) {
    this.selectedSeatCategory.set(category);
  }

  protected toggleEditMode() {
    this.isEditMode.update((v) => !v);
  }
}
