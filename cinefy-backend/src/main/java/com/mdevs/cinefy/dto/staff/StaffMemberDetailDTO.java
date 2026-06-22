package com.mdevs.cinefy.dto.staff;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class StaffMemberDetailDTO {

    private String id;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;

    private String position;

    private LocalDateTime hiredAt;

    private String employmentType;

    private String workingDayStart;

    private String workingDayEnd;

    private String workingHourStart;

    private String workingHourEnd;
}
