const STAFF_POSITION_LABELS = {
  MANAGER: 'Manager',
  PROJECTIONIST: 'Projectionist',
  CASHIER: 'Cashier',
  CONCESSIONS: 'Concessions',
  USHER: 'Usher',
} as const;

type StaffPosition = keyof typeof STAFF_POSITION_LABELS;

const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
} as const;

type EmploymentType = keyof typeof EMPLOYMENT_TYPE_LABELS;

const WEEK_DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
} as const;

type WeekDay = keyof typeof WEEK_DAY_LABELS;

interface StaffMember {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  position: StaffPosition;
  workingDayStart: WeekDay;
  workingDayEnd: WeekDay;
  workingHourStart: string;
  workingHourEnd: string;
  hiredAt: string;
  employmentType: EmploymentType;
}

export { STAFF_POSITION_LABELS, EMPLOYMENT_TYPE_LABELS, WEEK_DAY_LABELS };
export type { StaffMember, StaffPosition, EmploymentType, WeekDay };
