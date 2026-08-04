import { Component, computed, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { EmptyStateComponent, ModalComponent, Switch } from 'cinefy-ui/components';
import {
  AlertIcon,
  CreditCardIcon,
  DeleteIcon,
  EditIcon,
  EyeIcon,
  InfoIcon,
  PowerIcon,
  PowerOffIcon,
} from '../../../shared/icons';
import { GATEWAY_PROVIDER_LABELS, type PaymentGateway } from '../../../shared/types';

const MOCK_GATEWAYS: PaymentGateway[] = [
  {
    id: 'gw_01',
    name: 'Paymob - Production',
    provider: 'PAYMOB',
    isActive: true,
    createdAt: '2026-02-12',
    channels: [
      {
        name: 'Cards',
        currency: 'EGP',
        isActive: true,
        providerConfig: { integrationId: 4827193 },
      },
      {
        name: 'Mobile wallets',
        currency: 'EGP',
        isActive: true,
        providerConfig: { integrationId: 4827511 },
      },
      {
        name: 'Cards - USD',
        currency: 'USD',
        isActive: false,
        providerConfig: { integrationId: 4830042 },
      },
    ],
  },
  {
    id: 'gw_02',
    name: 'Paymob - Sandbox',
    provider: 'PAYMOB',
    isActive: false,
    createdAt: '2026-04-28',
    channels: [
      {
        name: 'Cards',
        currency: 'EGP',
        isActive: true,
        providerConfig: { integrationId: 4710228 },
      },
      {
        name: 'Installments',
        currency: 'EGP',
        isActive: false,
        providerConfig: { integrationId: 4710901 },
      },
    ],
  },
  {
    id: 'gw_03',
    name: 'Paymob - Legacy account',
    provider: 'PAYMOB',
    isActive: false,
    createdAt: '2025-08-14',
    channels: [
      {
        name: 'Cards',
        currency: 'EGP',
        isActive: false,
        providerConfig: { integrationId: 4392107 },
      },
    ],
  },
];

@Component({
  selector: 'gateway-list',
  imports: [
    LucideDynamicIcon,
    DatePipe,
    NgTemplateOutlet,
    NgpDialogTrigger,
    Switch,
    EmptyStateComponent,
    ModalComponent,
  ],
  templateUrl: './gateway-list.html',
  styleUrl: './gateway-list.scss',
})
export class GatewayListComponent {
  protected readonly icons = {
    AlertIcon,
    CreditCardIcon,
    DeleteIcon,
    EditIcon,
    EyeIcon,
    InfoIcon,
    PowerIcon,
    PowerOffIcon,
  };

  protected readonly providerLabels = GATEWAY_PROVIDER_LABELS;

  protected readonly gateways = signal<PaymentGateway[]>(MOCK_GATEWAYS);

  protected readonly activeGateway = computed(
    () => this.gateways().find((gateway) => gateway.isActive) ?? null,
  );

  protected readonly standbyGateways = computed(() =>
    this.gateways().filter((gateway) => !gateway.isActive),
  );

  protected readonly liveChannelCount = computed(
    () => this.activeGateway()?.channels?.filter((channel) => channel.isActive).length ?? 0,
  );

  protected toggleGateway(id: string, isActive: boolean): void {
    this.gateways.update((gateways) =>
      gateways.map((gateway) => {
        if (gateway.id === id) return { ...gateway, isActive };
        return isActive && gateway.isActive ? { ...gateway, isActive: false } : gateway;
      }),
    );
  }
}
