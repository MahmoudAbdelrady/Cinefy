package com.mdevs.cinefy.shared.oauth;

import com.mdevs.cinefy.entity.enums.OAuthProvider;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OAuthProviderClientFactory {

    private final GoogleOAuthClient googleOAuthClient;

    public OAuthProviderClient getClient(OAuthProvider provider) {
        return switch (provider) {
            case GOOGLE -> googleOAuthClient;
            case APPLE -> throw new BusinessException("Unsupported OAuthProvider: " + provider);
        };
    }
}
