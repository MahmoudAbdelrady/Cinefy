package com.mdevs.cinefy.dto.client;

import com.mdevs.cinefy.shared.validation.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignUpDTO {

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

    @NotBlank(message = "Email is required")
    @Pattern(regexp = ValidationPatterns.EMAIL, message = ValidationPatterns.EMAIL_MESSAGE)
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Pattern(regexp = ValidationPatterns.PASSWORD, message = ValidationPatterns.PASSWORD_MESSAGE)
    private String password;
}
