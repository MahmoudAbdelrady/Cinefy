import { Component } from '@angular/core';
import { OAuthProvider } from '../../../shared/types';

@Component({
  selector: 'oauth-buttons',
  imports: [],
  templateUrl: './oauth-buttons.html',
  styleUrl: './oauth-buttons.scss',
})
export class OAuthButtonsComponent {
  protected readonly providers: OAuthProvider[] = [
    {
      label: 'Google',
      code: 'google',
      iconSrc: '/Assets/google-icon-logo.svg',
      authenticate: () => this.authenticateWith('google'),
    },
    {
      label: 'Apple',
      code: 'apple',
      iconSrc: '/Assets/apple-icon-logo.png',
      authenticate: () => this.authenticateWith('apple'),
    },
  ];

  private authenticateWith(_code: string) {
    // OAuth flow wired later.
  }
}
