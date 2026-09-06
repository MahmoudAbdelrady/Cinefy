import { Component } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'test-page',
  imports: [Tooltip],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {}
