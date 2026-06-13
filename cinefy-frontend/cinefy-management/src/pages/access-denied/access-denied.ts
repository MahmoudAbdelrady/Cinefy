import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { ShieldXIcon } from '../../shared/icons';

@Component({
  selector: 'access-denied-page',
  imports: [RouterLink, LucideDynamicIcon],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.scss',
})
export class AccessDeniedPage {
  protected readonly icons = {
    ShieldXIcon,
  };
}
