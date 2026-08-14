package com.mdevs.cinefy.shared.oauth;

import org.springframework.stereotype.Component;

@Component
public class GoogleOAuthClient implements OAuthProviderClient {

    @Override
    public String getAuthorizationUrl() {
        return null;
    }

    @Override
    public OAuthUserProfile exchangeCode(String code, String state) {
        return null;
    }
}
