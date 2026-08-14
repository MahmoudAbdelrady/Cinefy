package com.mdevs.cinefy.shared.oauth;

import com.mdevs.cinefy.shared.exception.types.BusinessException;
import org.apache.commons.lang3.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

public abstract class OAuthProviderClient {

    public static final String OAUTH_STATE_COOKIE = "oauthState";

    public static final long OAUTH_STATE_COOKIE_MAX_AGE_MS = 600000;

    public abstract OAuthAuthorizationDTO getAuthorizationUrl();

    public abstract OAuthUserProfile exchangeCode(String code, String state, String cookieStateToken);

    // =========================== Helpers ===========================

    protected String issueState() {
        return UUID.randomUUID().toString();
    }

    protected void validateState(String state, String cookieStateToken) {
        if (StringUtils.isEmpty(state) || StringUtils.isEmpty(cookieStateToken) || !MessageDigest.isEqual(
                state.getBytes(StandardCharsets.UTF_8), cookieStateToken.getBytes(StandardCharsets.UTF_8))) {
            throw new BusinessException("Invalid sign-in request");
        }
    }
}
