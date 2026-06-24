export interface OAuthProvider {
  label: string;
  code: string;
  iconSrc: string;
  authenticate: () => void;
}

export type AuthFormStage = 'form' | 'verify';

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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  code: string;
  newPassword: string;
}
