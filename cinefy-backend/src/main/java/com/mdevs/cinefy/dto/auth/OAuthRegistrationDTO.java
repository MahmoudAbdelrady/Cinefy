package com.mdevs.cinefy.dto.auth;

public record OAuthRegistrationDTO(
        String registrationToken,

        String email,

        String firstName,

        String lastName
) {

}
