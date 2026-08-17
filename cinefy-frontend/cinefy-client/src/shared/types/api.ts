export type ApiErrorCode =
  | 'ACCOUNT_NOT_VERIFIED'
  | 'OTP_INVALID'
  | 'PASSWORD_INCORRECT'
  | 'PASSWORD_REUSED'
  | 'PAYMENT_NOT_ATTEMPTED';

export interface Redirection {
  url: string;
}

export interface ApiError {
  message: string;
  errorCode?: ApiErrorCode;
  data?: unknown;
}
