export interface OAuthProvider {
  label: string;
  code: string;
  iconSrc: string;
  authenticate: () => void;
}
