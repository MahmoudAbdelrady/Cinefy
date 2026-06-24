export type ApiErrorCode = 'ACCOUNT_NOT_VERIFIED' | 'OTP_INVALID' | 'PASSWORD_REUSED';

export interface ApiError {
  message: string;
  errorCode?: ApiErrorCode;
  data?: unknown;
}
