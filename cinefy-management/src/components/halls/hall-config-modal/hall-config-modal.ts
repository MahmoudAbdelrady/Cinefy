import { Component, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule, Settings, Star, DollarSign, LayoutDashboard } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { ModalComponent } from '../../modal/modal';
import { HallType, HallListItem } from '../../../shared/types';
import { HallLayoutEditorComponent } from '../../';

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
export class HallConfigModalComponent {
  protected readonly SettingsIcon = Settings;
  protected readonly StarIcon = Star;
  protected readonly DollarSignIcon = DollarSign;
  protected readonly LayoutIcon = LayoutDashboard;

  readonly close = input.required<() => void>();
  readonly hallTypes = input.required<HallType[]>();
  readonly existingHalls = input.required<HallListItem[]>();

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
}
