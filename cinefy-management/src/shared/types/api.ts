export type ApiErrorCode = 'OTP_INVALID' | 'PASSWORD_REUSED' | 'PASSWORD_INCORRECT';

export interface ApiError {
  message: string;
  errorCode?: ApiErrorCode;
  data?: unknown;
}
