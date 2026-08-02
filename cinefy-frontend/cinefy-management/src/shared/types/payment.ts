const PAYMENT_METHOD_TYPE_LABELS = {
  CARD: 'Card',
  WALLET: 'Wallet',
  INSTALLMENT: 'Installment',
} as const;

type PaymentMethodType = keyof typeof PAYMENT_METHOD_TYPE_LABELS;

const PAYMENT_METHOD_STATUS_LABELS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  INACTIVE: 'Disabled',
} as const;

type PaymentMethodStatus = keyof typeof PAYMENT_METHOD_STATUS_LABELS;

const PAYMENT_METHOD_TEST_STATUS_LABELS = {
  UNTESTED: 'Untested',
  SUCCESS: 'Passed',
  FAILURE: 'Failed',
} as const;

type PaymentMethodTestStatus = keyof typeof PAYMENT_METHOD_TEST_STATUS_LABELS;

interface PaymentMethod {
  name: string;
  type: PaymentMethodType;
  currency: string;
  publicKey: string;
  secretKey: string | null;
  hmacSecret: string | null;
  integrationId: number;
  connectionTestRequested: boolean;
}

interface PaymentMethodSummary {
  id: string;
  name: string;
  status: PaymentMethodStatus;
  type: PaymentMethodType;
  currency: string;
  publicKey: string;
  secretKeyHint: string;
  hmacKeyHint: string;
  integrationId: number;
  testStatus: PaymentMethodTestStatus;
  testFailureReason?: string;
  testedAt?: string;
  successRate?: string;
  credentialsRotatedAt: string;
  createdAt: string;
}

interface PaymentMethodDetail {
  id: string;
  name: string;
  type: PaymentMethodType;
  currency: string;
  publicKey: string;
  integrationId: number;
  testStatus: PaymentMethodTestStatus;
  testFailureReason?: string;
  testedAt?: string;
}

interface PaymentMethodTestResult {
  id: string;
  testStatus: PaymentMethodTestStatus;
  testFailureReason?: string;
}

interface PaymentMethodStatusRequest {
  status: PaymentMethodStatus;
}

interface TestConnectionRequest {
  paymentMethodId?: string;
  secretKey?: string;
  integrationId: number;
  currency: string;
}

export { PAYMENT_METHOD_TYPE_LABELS, PAYMENT_METHOD_STATUS_LABELS };
export type {
  PaymentMethodType,
  PaymentMethodStatus,
  PaymentMethodTestStatus,
  PaymentMethod,
  PaymentMethodSummary,
  PaymentMethodDetail,
  PaymentMethodTestResult,
  PaymentMethodStatusRequest,
  TestConnectionRequest,
};
