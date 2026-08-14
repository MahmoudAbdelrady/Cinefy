package com.mdevs.cinefy.shared.oauth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GoogleOAuthClient extends OAuthProviderClient {

    @Value("${cinefy.oauth.google.client-id}")
    private String clientId;

    @Value("${cinefy.oauth.google.client-secret}")
    private String clientSecret;

    @Value("${cinefy.oauth.google.redirect-uri}")
    private String redirectUri;

    private static final String AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";

    @Override
    public OAuthAuthorizationDTO getAuthorizationUrl() {
        String stateToken = issueState();
        String authorizationUrl = UriComponentsBuilder.fromUriString(AUTHORIZATION_URL)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("state", stateToken)
                .build()
                .encode()
                .toUriString();

        return new OAuthAuthorizationDTO(authorizationUrl, stateToken);
    }

    @Override
    public OAuthUserProfile exchangeCode(String code, String state, String cookieStateToken) {
        validateState(state, cookieStateToken);
        return null;
    }
}
