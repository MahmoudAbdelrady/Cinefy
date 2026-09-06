import { Component, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

const TOAST_KEY = 'test';
const TOAST_LIFE = 4000;

@Component({
  selector: 'test-page',
  imports: [Toast],
  providers: [MessageService],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  private readonly messageService = inject(MessageService);

  protected readonly toastKey = TOAST_KEY;
  protected readonly toastLife = TOAST_LIFE;

  protected showSuccess(): void {
    this.messageService.add({
      key: TOAST_KEY,
      severity: 'success',
      summary: 'Showtime published',
    });
  }

  protected showError(): void {
    this.messageService.add({
      key: TOAST_KEY,
      severity: 'error',
      summary: 'Could not delete the hall',
    });
  }

  protected showSticky(): void {
    this.messageService.add({
      key: TOAST_KEY,
      severity: 'success',
      summary: 'Sticky toast — stays until dismissed',
      sticky: true,
    });
  }

  protected showNotClosable(): void {
    this.messageService.add({
      key: TOAST_KEY,
      severity: 'error',
      summary: 'No close button on this one',
      closable: false,
    });
  }

  protected dismissAll(): void {
    this.messageService.clear(TOAST_KEY);
  }
}
