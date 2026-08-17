package com.mdevs.cinefy.shared.oauth;

import com.mdevs.cinefy.entity.enums.OAuthProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OAuthProviderClientFactory {

    private final GoogleOAuthClient googleOAuthClient;

    private final MicrosoftOAuthClient microsoftOAuthClient;

    public OAuthProviderClient getClient(OAuthProvider provider) {
        return switch (provider) {
            case GOOGLE -> googleOAuthClient;
            case MICROSOFT -> microsoftOAuthClient;
        };
    }
}
