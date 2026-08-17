package com.mdevs.cinefy.dto.auth;

public record OAuthCallbackResultDTO(
        TokenPairDTO tokens,

        OAuthRegistrationDTO registration
) {

    public static OAuthCallbackResultDTO signedIn(TokenPairDTO tokens) {
        return new OAuthCallbackResultDTO(tokens, null);
    }

    public static OAuthCallbackResultDTO registrationRequired(OAuthRegistrationDTO registration) {
        return new OAuthCallbackResultDTO(null, registration);
    }
}
