export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface ClientPaymentMethod {
  id: string;
  cardBrand: string;
  cardNumber: string;
}

export interface SavedCardPaymentRequest {
  paymentMethodId: string;
}
