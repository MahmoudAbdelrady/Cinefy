export type ApiErrorCode = 'OTP_INVALID' | 'PASSWORD_REUSED';

export interface ApiError {
  message: string;
  errorCode?: ApiErrorCode;
  data?: unknown;
}
