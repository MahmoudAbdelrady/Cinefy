export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const NAME_PATTERN = /^\p{L}+([ '\-]\p{L}+)*$/u;
export const RESOURCE_NAME_PATTERN = /^[A-Za-z0-9]+([ -][A-Za-z0-9]+)*$/;
export const NO_WHITESPACE_PATTERN = /^\S+$/;
export const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
