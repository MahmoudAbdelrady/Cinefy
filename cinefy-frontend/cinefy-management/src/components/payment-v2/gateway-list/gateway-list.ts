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
  WebhookIcon,
} from '../../../shared/icons';
import {
  GATEWAY_PROVIDER_LABELS,
  type PaymentGateway,
  type PaymentGatewayRequest,
} from '../../../shared/types';
import { ManageGatewayModalComponent } from '../manage-gateway-modal/manage-gateway-modal';

const MOCK_GATEWAYS: PaymentGateway[] = [
  {
    id: 'gw_01',
    name: 'Paymob - Production',
    provider: 'PAYMOB',
    active: true,
    createdAt: '2026-02-12',
    paymentChannels: [
      {
        name: 'Cards',
        currency: 'EGP',
        active: true,
        providerConfig: { integrationId: 4827193 },
      },
      {
        name: 'Mobile wallets',
        currency: 'EGP',
        active: true,
        providerConfig: { integrationId: 4827511 },
      },
      {
        name: 'Cards - USD',
        currency: 'USD',
        active: false,
        providerConfig: { integrationId: 4830042 },
      },
    ],
  },
  {
    id: 'gw_02',
    name: 'Paymob - Sandbox',
    provider: 'PAYMOB',
    active: false,
    createdAt: '2026-04-28',
    paymentChannels: [
      {
        name: 'Cards',
        currency: 'EGP',
        active: true,
        providerConfig: { integrationId: 4710228 },
      },
      {
        name: 'Installments',
        currency: 'EGP',
        active: false,
        providerConfig: { integrationId: 4710901 },
      },
    ],
  },
  {
    id: 'gw_03',
    name: 'Paymob - Legacy account',
    provider: 'PAYMOB',
    active: false,
    createdAt: '2025-08-14',
    paymentChannels: [
      {
        name: 'Cards',
        currency: 'EGP',
        active: false,
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
    ManageGatewayModalComponent,
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
    WebhookIcon,
  };

  protected readonly providerLabels = GATEWAY_PROVIDER_LABELS;

  protected readonly gateways = signal<PaymentGateway[]>(MOCK_GATEWAYS);

  protected readonly activeGateway = computed(
    () => this.gateways().find((gateway) => gateway.active) ?? null,
  );

  protected readonly standbyGateways = computed(() =>
    this.gateways().filter((gateway) => !gateway.active),
  );

  protected readonly liveChannelCount = computed(
    () => this.activeGateway()?.paymentChannels?.filter((channel) => channel.active).length ?? 0,
  );

  protected toggleGateway(id: string, active: boolean): void {
    this.gateways.update((gateways) =>
      gateways.map((gateway) => {
        if (gateway.id === id) return { ...gateway, active };
        return active && gateway.active ? { ...gateway, active: false } : gateway;
      }),
    );
  }

  protected deleteGateway(id: string): void {
    this.gateways.update((gateways) => gateways.filter((gateway) => gateway.id !== id));
  }

  protected updateGateway(id: string, request: PaymentGatewayRequest): void {
    this.gateways.update((gateways) =>
      gateways.map((gateway) => (gateway.id === id ? { ...gateway, ...request } : gateway)),
    );
  }
}
