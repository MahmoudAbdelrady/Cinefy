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
    @Pattern(
            regexp = "^\\p{L}+([ '\\-]\\p{L}+)*$",
            message = "First name may only contain letters, spaces, hyphens, and apostrophes"
    )
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be 2-50 characters")
    @Pattern(
            regexp = "^\\p{L}+([ '\\-]\\p{L}+)*$",
            message = "Last name may only contain letters, spaces, hyphens, and apostrophes"
    )
    private String lastName;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be 3-30 characters")
    @Pattern(
            regexp = "^[a-z](?:[a-z0-9]|[._-](?=[a-z0-9]))*$",
            message = "Username must start with a lowercase letter and contain only lowercase letters, digits, dots, underscores, or hyphens (no consecutive or trailing separators)"
    )
    private String username;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    @Pattern(
            regexp = "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
            message = "Email must be a valid address"
    )
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
