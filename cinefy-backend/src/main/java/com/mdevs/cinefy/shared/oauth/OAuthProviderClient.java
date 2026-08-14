package com.mdevs.cinefy.shared.oauth;

public interface OAuthProviderClient {

    String getAuthorizationUrl();

    OAuthUserProfile exchangeCode(String code, String state);
}
