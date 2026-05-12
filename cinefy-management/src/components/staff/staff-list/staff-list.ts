import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import {
  CalendarClock,
  Eye,
  LucideAngularModule,
  Mail,
  Phone,
  Search,
  SquarePen,
  Trash2,
  Users,
} from 'lucide-angular';
import { CustomSelectComponent } from '../../drop-down/custom-select/custom-select';
import { InputField } from '../../input-field/input-field';
import { PaginationComponent } from '../../pagination/pagination';

interface StaffMember {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  position: string;
  workingDays: string;
  workingHours: string;
  hiredAt: string;
  employmentType: 'Full-time' | 'Part-time';
}

@Component({
  selector: 'staff-list',
  imports: [LucideAngularModule, CustomSelectComponent, InputField, PaginationComponent],
  templateUrl: './staff-list.html',
  styleUrl: './staff-list.scss',
})
export class StaffListComponent {
  protected readonly SearchIcon = Search;
  protected readonly EmailIcon = Mail;
  protected readonly PhoneIcon = Phone;
  protected readonly CalendarClockIcon = CalendarClock;
  protected readonly UsersIcon = Users;
  protected readonly EyeIcon = Eye;
  protected readonly EditIcon = SquarePen;
  protected readonly DeleteIcon = Trash2;

  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly totalItems = computed(() => this.staffMembers.length);
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize)),
  );

  constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.onSearch(value));
  }

  protected readonly StaffPositions: string[] = [
    'Manager',
    'Projectionist',
    'Cashier',
    'Concessions',
    'Usher',
  ];

  protected readonly staffMembers: StaffMember[] = [
    {
      id: 'st_01',
      username: 'yara.elsayed',
      fullName: 'Yara El-Sayed',
      email: 'yara.elsayed@cinefy.eg',
      phoneNumber: '+20 100 422 8841',
      position: 'Manager',
      workingDays: 'Mon–Fri',
      workingHours: '10:00–19:00',
      hiredAt: '2024-03-11',
      employmentType: 'Full-time',
    },
    {
      id: 'st_02',
      username: 'omar.hassan',
      fullName: 'Omar Hassan',
      email: 'omar.hassan@cinefy.eg',
      phoneNumber: '+20 109 718 0260',
      position: 'Projectionist',
      workingDays: 'Tue–Sat',
      workingHours: '14:00–23:00',
      hiredAt: '2023-11-02',
      employmentType: 'Full-time',
    },
    {
      id: 'st_03',
      username: 'mariam.nabil',
      fullName: 'Mariam Nabil',
      email: 'mariam.nabil@cinefy.eg',
      phoneNumber: '+20 122 305 7714',
      position: 'Cashier',
      workingDays: 'Wed–Sun',
      workingHours: '12:00–20:00',
      hiredAt: '2025-08-19',
      employmentType: 'Part-time',
    },
    {
      id: 'st_04',
      username: 'tarek.abdelaziz',
      fullName: 'Tarek Abdelaziz',
      email: 'tarek.abdelaziz@cinefy.eg',
      phoneNumber: '+20 111 540 9162',
      position: 'Usher',
      workingDays: 'Thu–Mon',
      workingHours: '16:00–23:59',
      hiredAt: '2026-01-22',
      employmentType: 'Part-time',
    },
    {
      id: 'st_05',
      username: 'habiba.saad',
      fullName: 'Habiba Saad',
      email: 'habiba.saad@cinefy.eg',
      phoneNumber: '+20 106 884 2207',
      position: 'Concessions',
      workingDays: 'Mon–Fri',
      workingHours: '13:00–21:00',
      hiredAt: '2025-04-30',
      employmentType: 'Full-time',
    },
    {
      id: 'st_06',
      username: 'karim.fouad',
      fullName: 'Karim Fouad',
      email: 'karim.fouad@cinefy.eg',
      phoneNumber: '+20 128 217 4593',
      position: 'Cashier',
      workingDays: 'Fri–Tue',
      workingHours: '17:00–23:59',
      hiredAt: '2024-09-08',
      employmentType: 'Part-time',
    },
  ];

  protected readonly positionDisplayFn = (position: string): string => position;

  protected onSearch(value: string): void {
    console.log('Search value:', value);
  }

  protected onPositionFilterChange(position: string): void {
    console.log('Position filter changed:', position);
  }

  protected onPositionFilterCleared(): void {
    console.log('Position filter cleared');
  }
}
