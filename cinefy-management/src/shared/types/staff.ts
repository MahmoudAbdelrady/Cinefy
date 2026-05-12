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

export type { StaffMember };
