import { GATEWAY_PROVIDER_LABELS, type GatewayProvider } from '../../shared/types';

interface CredentialField {
  key: string;
  label: string;
  secret: boolean;
  placeholder: string;
  hint: string;
}

interface ProviderConfigField {
  key: string;
  label: string;
  type: 'text' | 'number';
  placeholder: string;
}

interface ProviderSpec {
  provider: GatewayProvider;
  label: string;
  supportsChannels: boolean;
  channelsRequired: boolean;
  channelHelp: string;
  docsUrl: string;
  credentialFields: CredentialField[];
  providerConfig?: ProviderConfigField[];
}

const PAYMENT_PROVIDERS: ProviderSpec[] = [
  {
    provider: 'PAYMOB',
    label: GATEWAY_PROVIDER_LABELS.PAYMOB,
    supportsChannels: true,
    channelsRequired: true,
    channelHelp: 'Where to find: Settings → Developers → Payment Integrations',
    docsUrl: 'https://developers.paymob.com/paymob-docs/getting-started/overview',
    credentialFields: [
      {
        key: 'secretKey',
        label: 'Secret key',
        secret: true,
        placeholder: 'egy_sk_live_…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
      {
        key: 'publicKey',
        label: 'Public key',
        secret: false,
        placeholder: 'egy_pk_live_…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
      {
        key: 'hmacKey',
        label: 'HMAC key',
        secret: true,
        placeholder: 'b4a91c84e6f7d3a1…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
    ],
    providerConfig: [
      {
        key: 'integrationId',
        label: 'Integration ID',
        type: 'number',
        placeholder: '4827193',
      },
    ],
  },
];

export { PAYMENT_PROVIDERS };
export type { CredentialField, ProviderConfigField, ProviderSpec };
