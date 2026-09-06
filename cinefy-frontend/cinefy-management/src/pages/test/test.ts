import { Component, inject } from '@angular/core';
import { CinefyToast } from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';

@Component({
  selector: 'test-page',
  imports: [CinefyToast],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  private readonly toast = inject(CinefyToastService);

  protected showSuccess(): void {
    this.toast.success('Showtime published');
  }

  protected showError(): void {
    this.toast.error('Could not delete the hall');
  }
}
