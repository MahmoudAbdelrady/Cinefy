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
    @Size(
            min = ValidationPatterns.NAME_MIN_LENGTH,
            max = ValidationPatterns.NAME_MAX_LENGTH,
            message = ValidationPatterns.FIRST_NAME_SIZE_MESSAGE
    )
    @Pattern(regexp = ValidationPatterns.NAME, message = ValidationPatterns.NAME_MESSAGE)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(
            min = ValidationPatterns.NAME_MIN_LENGTH,
            max = ValidationPatterns.NAME_MAX_LENGTH,
            message = ValidationPatterns.LAST_NAME_SIZE_MESSAGE
    )
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
