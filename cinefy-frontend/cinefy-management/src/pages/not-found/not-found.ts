import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CinefyNotFound } from 'cinefy-ui/components';

@Component({
  selector: 'not-found-page',
  imports: [RouterLink, CinefyNotFound],
  templateUrl: './not-found.html',
})
export class NotFoundPage {}
