import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { ClapperboardIcon, TicketXIcon, ArrowLeftIcon } from '../../shared/icons';

@Component({
  selector: 'not-found-page',
  imports: [RouterLink, LucideDynamicIcon],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFoundPage {
  protected readonly icons = {
    ClapperboardIcon,
    TicketXIcon,
    ArrowLeftIcon,
  };
}
