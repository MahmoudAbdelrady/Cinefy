import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CuiPaginatedSelect } from 'cinefy-ui/components';
import { StaffService } from '../../services';

@Component({
  selector: 'test-page',
  imports: [ReactiveFormsModule, CuiPaginatedSelect],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  private readonly staffService = inject(StaffService);

  protected readonly selectForm = new FormGroup({
    staff: new FormControl<string | null>(null),
    staffMulti: new FormControl<string[]>([], { nonNullable: true }),
  });

  protected readonly fetchStaff = (page: number, size: number) =>
    this.staffService.getStaffMembers(undefined, undefined, { page, size });
}
