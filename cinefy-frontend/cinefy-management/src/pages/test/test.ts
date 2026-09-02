import { Component, signal } from '@angular/core';
import { CinefyDialog, CinefyDialogFooter, CinefyDialogHeader } from 'cinefy-ui/components';

@Component({
  selector: 'test-page',
  imports: [CinefyDialog, CinefyDialogHeader, CinefyDialogFooter],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly plainVisible = signal(false);
  protected readonly customVisible = signal(false);
  protected readonly bothVisible = signal(false);
  protected readonly threeVisible = signal(false);
}
