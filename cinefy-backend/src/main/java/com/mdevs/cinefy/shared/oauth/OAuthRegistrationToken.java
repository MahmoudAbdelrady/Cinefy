package com.mdevs.cinefy.shared.oauth;

import java.time.Instant;

public record OAuthRegistrationToken(
        String email,

        String firstName,

        String lastName,

        Instant expiresAt
) {

}
