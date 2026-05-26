import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShieldX } from 'lucide-angular';

@Component({
  selector: 'access-denied-page',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.scss',
})
export class AccessDeniedPage {
  protected readonly icons = {
    ShieldXIcon: ShieldX,
  };
}
