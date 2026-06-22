export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetCodePayload {
  code: string;
}

export interface ResetPasswordPayload {
  code: string;
  newPassword: string;
}
