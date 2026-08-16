package com.mdevs.cinefy.shared.oauth;

public record OAuthState(
        String provider,

        String token
) {

}
