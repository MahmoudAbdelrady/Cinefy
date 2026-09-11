package com.mdevs.cinefy.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OAuthCallbackResponseDTO(
        OAuthRegistrationDTO registration,

        String redirectUrl
) {

}
