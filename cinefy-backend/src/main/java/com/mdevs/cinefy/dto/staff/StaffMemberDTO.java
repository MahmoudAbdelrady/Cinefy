package com.mdevs.cinefy.dto.staff;

import com.mdevs.cinefy.shared.validation.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StaffMemberDTO {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be 2-50 characters")
    @Pattern(regexp = ValidationPatterns.NAME, message = ValidationPatterns.NAME_MESSAGE)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be 2-50 characters")
    @Pattern(regexp = ValidationPatterns.NAME, message = ValidationPatterns.NAME_MESSAGE)
    private String lastName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    @Pattern(regexp = ValidationPatterns.EMAIL, message = ValidationPatterns.EMAIL_MESSAGE)
    private String email;

    @Pattern(regexp = ValidationPatterns.PASSWORD, message = ValidationPatterns.PASSWORD_MESSAGE)
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
