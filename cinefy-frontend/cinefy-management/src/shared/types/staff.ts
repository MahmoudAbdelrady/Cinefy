const USER_POSITION_LABELS = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  USHER: 'Usher',
} as const;

type UserPosition = keyof typeof USER_POSITION_LABELS;

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

interface StaffMemberSummary {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  position: UserPosition;
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
  position: UserPosition;
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
  position: UserPosition;
}

interface StaffMemberPayload {
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber: string;
  email: string;
  password?: string;
  position: UserPosition;
  employmentType: EmploymentType;
  workingDayStart: WeekDay;
  workingDayEnd: WeekDay;
  workingHourStart: string;
  workingHourEnd: string;
}

interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface PositionCoverageItem {
  position: UserPosition;
  count: number;
}

interface PositionCoverage {
  total: number;
  positions: PositionCoverageItem[];
}

type CoverageChange =
  | { action: 'add'; position: UserPosition }
  | { action: 'delete'; position: UserPosition }
  | { action: 'reassign'; from: UserPosition; to: UserPosition };

export { USER_POSITION_LABELS, EMPLOYMENT_TYPE_LABELS, WEEK_DAY_LABELS };
export type {
  StaffMemberSummary,
  StaffMemberDetail,
  CurrentStaffMember,
  StaffMemberPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  UserPosition,
  EmploymentType,
  WeekDay,
  PositionCoverage,
  PositionCoverageItem,
  CoverageChange,
};
