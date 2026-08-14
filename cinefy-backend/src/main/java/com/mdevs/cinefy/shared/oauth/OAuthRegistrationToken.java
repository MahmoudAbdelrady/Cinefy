package com.mdevs.cinefy.shared.oauth;

import java.time.LocalDateTime;

public record OAuthRegistrationToken(
        String email,

        String firstName,

        String lastName,

        LocalDateTime expiresAt
) {

}
