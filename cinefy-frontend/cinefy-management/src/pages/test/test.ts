import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

const DATES = ['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10'];

@Component({
  selector: 'test-page',
  imports: [Tabs, TabList, Tab, TabPanels, TabPanel, DatePipe],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly dates = DATES;

  protected readonly selectedDate = signal<string | undefined>(DATES[0]);
}
