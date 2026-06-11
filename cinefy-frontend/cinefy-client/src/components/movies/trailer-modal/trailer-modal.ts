import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ModalComponent } from 'cinefy-ui/components';

@Component({
  selector: 'trailer-modal',
  imports: [ModalComponent],
  templateUrl: './trailer-modal.html',
  styleUrl: './trailer-modal.scss',
})
export class TrailerModalComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly trailerUrl = input.required<string>();

  readonly title = input.required<string>();

  readonly close = input.required<() => void>();

  protected readonly embedUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(`${this.trailerUrl()}?autoplay=1`),
  );
}
