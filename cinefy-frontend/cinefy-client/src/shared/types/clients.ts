export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
}

export interface ClientPaymentMethod {
  id: string;
  cardBrand: string;
  cardNumber: string;
}
