import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'test-page',
  imports: [FormsModule, Dialog, ButtonDirective, InputText],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected visible = false;
  protected name = '';
  protected email = '';
}
