package com.mdevs.cinefy.shared.oauth;

public record OAuthAuthorizationDTO(
        String authorizationUrl,

        String cookieStateToken
) {

}
