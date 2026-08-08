const GATEWAY_PROVIDER_LABELS = {
  PAYMOB: 'Paymob',
} as const;

type GatewayProvider = keyof typeof GATEWAY_PROVIDER_LABELS;

type ChannelCurrency = 'EGP' | 'USD';

type ProviderConfigValue = string | number;

interface PaymentChannel {
  name: string;
  currency: ChannelCurrency;
  active: boolean;
  providerConfig: Record<string, ProviderConfigValue>;
}

interface PaymentGateway {
  id: string;
  name: string;
  provider: GatewayProvider;
  active: boolean;
  credentials?: Record<string, string>;
  paymentChannels?: PaymentChannel[];
  createdAt: string;
}

interface PaymentGatewayList {
  active?: PaymentGateway;
  standBy: PaymentGateway[];
}

interface PaymentGatewayRequest {
  name: string;
  provider: GatewayProvider;
  credentials: Record<string, string>;
  paymentChannels?: PaymentChannel[];
}

export { GATEWAY_PROVIDER_LABELS };
export type {
  GatewayProvider,
  ChannelCurrency,
  ProviderConfigValue,
  PaymentChannel,
  PaymentGateway,
  PaymentGatewayList,
  PaymentGatewayRequest,
};
