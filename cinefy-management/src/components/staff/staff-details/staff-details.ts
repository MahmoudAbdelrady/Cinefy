import { Component, input } from '@angular/core';
import { ModalComponent } from '../../modal/modal';
import { StaffMember } from '../../../shared/types';
import {
  AtSign,
  BriefcaseBusiness,
  Calendar,
  Clock,
  Mail,
  Phone,
  LucideAngularModule,
  SquarePen,
} from 'lucide-angular';

@Component({
  selector: 'staff-details',
  imports: [ModalComponent, LucideAngularModule],
  templateUrl: './staff-details.html',
  styleUrl: './staff-details.scss',
})
export class StaffDetailsComponent {
  protected readonly UsernameIcon = AtSign;
  protected readonly EmailIcon = Mail;
  protected readonly PhoneIcon = Phone;
  protected readonly CalendarIcon = Calendar;
  protected readonly ClockIcon = Clock;
  protected readonly BriefCaseIcon = BriefcaseBusiness;
  protected readonly EditIcon = SquarePen;

  readonly close = input.required<() => void>();
  readonly staffMember = input.required<StaffMember>();
}
