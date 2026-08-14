package com.mdevs.cinefy.shared.oauth;

import com.mdevs.cinefy.config.general.AppConfig;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import jakarta.annotation.PostConstruct;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.UUID;

public abstract class OAuthProviderClient {

    public static final String OAUTH_STATE_COOKIE = "oauthState";

    public static final long OAUTH_STATE_COOKIE_MAX_AGE_MS = 600000;

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);

    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    protected RestClient restClient;

    @Value("${cinefy.oauth.redirect-uri}")
    private String redirectUri;

    @PostConstruct
    private void init() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT);
        requestFactory.setReadTimeout(READ_TIMEOUT);

        restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public abstract OAuthAuthorizationDTO getAuthorizationUrl();

    public abstract OAuthUserProfile exchangeCode(String code, String state, String cookieStateToken);

    // =========================== Helpers ===========================

    protected String getRedirectUri() {
        return AppConfig.getFrontendClientUrl() + redirectUri;
    }

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
