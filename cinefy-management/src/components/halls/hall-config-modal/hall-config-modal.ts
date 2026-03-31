import { Component, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule, Settings, Star, DollarSign } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { ModalComponent } from '../../modal/modal';
import { HallType, HallListItem } from '../../../shared/types';

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
  ],
  templateUrl: './hall-config-modal.html',
  styleUrl: './hall-config-modal.scss',
})
export class HallConfigModalComponent {
  protected readonly SettingsIcon = Settings;
  protected readonly StarIcon = Star;
  protected readonly DollarSignIcon = DollarSign;

  readonly close = input.required<() => void>();
  readonly hallTypes = input.required<HallType[]>();
  readonly existingHalls = input.required<HallListItem[]>();

  protected readonly seatCategoryItems = signal<SeatCategoryItem[]>([
    { name: 'Normal', type: 'normal' },
    { name: 'VIP', type: 'vip' },
    { name: 'Space/Aisle', type: 'aisle' },
  ]);

  protected selectedSeatCategory = signal<SeatCategoryItem>(this.seatCategoryItems()[0]);

  protected selectSeatCategory(category: SeatCategoryItem) {
    this.selectedSeatCategory.set(category);
  }
}
