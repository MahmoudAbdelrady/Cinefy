package com.mdevs.cinefy.dto.auth;

public record OAuthCallbackResultDTO(
        TokenPairDTO tokens,

        OAuthCallbackResponseDTO response
) {

}
