export interface OAuthProvider {
  label: string;
  code: string;
  iconSrc: string;
}

export type AuthFormStage = 'form' | 'verify';

export interface OAuthCallbackPayload {
  code: string;
  state: string;
}

export interface OAuthRegistration {
  registrationToken: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OAuthCallbackResult {
  registration?: OAuthRegistration;
  redirectUrl?: string;
}

export interface OAuthSignUpPayload {
  registrationToken: string;
  phoneNumber: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OtpCodePayload {
  code: string;
}

export type OtpType = 'EMAIL_VERIFICATION' | 'RESET_PASSWORD';

export interface SendOtpPayload {
  email: string;
  otpType: OtpType;
}

export interface VerifyOtpPayload {
  code: string;
  otpType: OtpType;
}

export interface ResetPasswordPayload {
  code: string;
  newPassword: string;
}
