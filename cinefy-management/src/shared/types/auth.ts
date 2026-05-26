export interface LoginPayload {
  username: string;
  password: string;
}

export interface ForgotPasswordPayload {
  username: string;
}

export interface VerifyResetCodePayload {
  code: string;
}

export interface ResetPasswordPayload {
  code: string;
  newPassword: string;
}
