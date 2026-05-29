import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotFoundComponent } from 'cinefy-ui/components';

@Component({
  selector: 'not-found-page',
  imports: [RouterLink, NotFoundComponent],
  templateUrl: './not-found.html',
})
export class NotFoundPage {}
