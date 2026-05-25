const STAFF_POSITION_LABELS = {
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
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

interface StaffMemberSummary {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  position: StaffPosition;
  workingDayStart: WeekDay;
  workingDayEnd: WeekDay;
  workingHourStart: string;
  workingHourEnd: string;
}

interface StaffMemberDetail {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  position: StaffPosition;
  hiredAt: string;
  employmentType: EmploymentType;
  workingDayStart: WeekDay;
  workingDayEnd: WeekDay;
  workingHourStart: string;
  workingHourEnd: string;
}

interface CurrentStaffMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: StaffPosition | 'ADMIN';
}

interface StaffMemberPayload {
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber: string;
  email: string;
  password?: string;
  position: StaffPosition;
  employmentType: EmploymentType;
  workingDayStart: WeekDay;
  workingDayEnd: WeekDay;
  workingHourStart: string;
  workingHourEnd: string;
}

interface PositionCoverageItem {
  position: StaffPosition;
  count: number;
}

interface PositionCoverage {
  total: number;
  positions: PositionCoverageItem[];
}

type CoverageChange =
  | { action: 'add'; position: StaffPosition }
  | { action: 'delete'; position: StaffPosition }
  | { action: 'reassign'; from: StaffPosition; to: StaffPosition };

export { STAFF_POSITION_LABELS, EMPLOYMENT_TYPE_LABELS, WEEK_DAY_LABELS };
export type {
  StaffMember,
  StaffMemberSummary,
  StaffMemberDetail,
  CurrentStaffMember,
  StaffMemberPayload,
  StaffPosition,
  EmploymentType,
  WeekDay,
  PositionCoverage,
  PositionCoverageItem,
  CoverageChange,
};
