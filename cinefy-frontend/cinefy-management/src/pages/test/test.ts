import { Component, signal } from '@angular/core';
import { CinefyPaginator } from 'cinefy-ui/components';

const PAGE_SIZE = 10;
const TOTAL_RECORDS = 87;

@Component({
  selector: 'test-page',
  imports: [CinefyPaginator],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly pageSize = PAGE_SIZE;
  protected readonly totalRecords = TOTAL_RECORDS;
  protected readonly pageCount = Math.ceil(TOTAL_RECORDS / PAGE_SIZE);

  protected readonly page = signal(0);
}
