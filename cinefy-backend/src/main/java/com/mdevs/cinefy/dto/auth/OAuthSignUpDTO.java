package com.mdevs.cinefy.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OAuthSignUpDTO {

    @NotBlank(message = "Registration token is required")
    private String registrationToken;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}
