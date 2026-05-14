package com.mdevs.cinefy.dto.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StaffMemberDTO {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    private String email;

    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol"
    )
    private String password;

    @NotBlank(message = "Position is required")
    private String position;

    @NotBlank(message = "Employment type is required")
    private String employmentType;

    @NotBlank(message = "Working day start is required")
    private String workingDayStart;

    @NotBlank(message = "Working day end is required")
    private String workingDayEnd;

    @NotBlank(message = "Working hour start is required")
    private String workingHourStart;

    @NotBlank(message = "Working hour end is required")
    private String workingHourEnd;
}
