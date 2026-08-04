const GATEWAY_PROVIDER_LABELS = {
  PAYMOB: 'Paymob',
} as const;

type GatewayProvider = keyof typeof GATEWAY_PROVIDER_LABELS;

type ChannelCurrency = 'EGP' | 'USD';

type ProviderConfigValue = string | number;

interface PaymentChannel {
  name: string;
  currency: ChannelCurrency;
  isActive: boolean;
  providerConfig: Record<string, ProviderConfigValue>;
}

interface PaymentGateway {
  id: string;
  name: string;
  provider: GatewayProvider;
  isActive: boolean;
  credentials?: Record<string, string>;
  channels?: PaymentChannel[];
  createdAt: string;
}

interface PaymentGatewayRequest {
  name: string;
  provider: GatewayProvider;
  isActive: boolean;
  credentials: Record<string, string>;
  channels?: PaymentChannel[];
}

export { GATEWAY_PROVIDER_LABELS };
export type {
  GatewayProvider,
  ChannelCurrency,
  ProviderConfigValue,
  PaymentChannel,
  PaymentGateway,
  PaymentGatewayRequest,
};
