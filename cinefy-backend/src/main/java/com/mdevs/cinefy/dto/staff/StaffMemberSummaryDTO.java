package com.mdevs.cinefy.dto.staff;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StaffMemberSummaryDTO {

    private String id;

    private String fullName;

    private String phoneNumber;

    private String email;

    private String position;

    private String workingDayStart;

    private String workingDayEnd;

    private String workingHourStart;

    private String workingHourEnd;
}
