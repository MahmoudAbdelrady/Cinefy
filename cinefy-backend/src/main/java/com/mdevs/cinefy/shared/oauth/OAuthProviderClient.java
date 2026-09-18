package com.mdevs.cinefy.shared.oauth;

import com.mdevs.cinefy.config.general.AppConfig;
import com.mdevs.cinefy.entity.enums.OAuthProvider;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import jakarta.annotation.PostConstruct;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

public abstract class OAuthProviderClient {

    public static final String OAUTH_STATE_COOKIE = "oauthState";

    public static final long OAUTH_STATE_COOKIE_MAX_AGE_MS = 600000;

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);

    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    private static final String STATE_SEPARATOR = ":";

    private static final String INVALID_STATE_MESSAGE = "Invalid sign-in request";

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

    public OAuthAuthorizationDTO getAuthorizationUrl(String redirectUrl) {
        OAuthState state = new OAuthState(getProvider().name(), UUID.randomUUID().toString(), toSafeRedirect(redirectUrl));
        StringBuilder rawState = new StringBuilder()
                .append(state.provider()).append(STATE_SEPARATOR).append(state.token());
        if (StringUtils.isNotEmpty(state.redirectUrl())) {
            rawState.append(STATE_SEPARATOR).append(state.redirectUrl());
        }

        String authorizationUrl = buildAuthorizationRequest()
                .queryParam("state", encodeState(rawState.toString()))
                .build()
                .encode()
                .toUriString();

        return new OAuthAuthorizationDTO(authorizationUrl, state.token());
    }

    public OAuthUserProfile exchangeCode(String code, String state, String cookieStateToken) {
        validateState(state, cookieStateToken);
        return readUserProfile(code);
    }

    public static OAuthState parseState(String state) {
        if (StringUtils.isEmpty(state)) {
            throw new BusinessException(INVALID_STATE_MESSAGE);
        }

        String[] parts = decodeState(state).split(STATE_SEPARATOR, 3);
        if (parts.length < 2 || StringUtils.isEmpty(parts[0]) || StringUtils.isEmpty(parts[1])) {
            throw new BusinessException(INVALID_STATE_MESSAGE);
        }

        return new OAuthState(parts[0], parts[1], parts.length == 3 ? toSafeRedirect(parts[2]) : null);
    }

    // ====================== Provider Contract ======================

    protected abstract OAuthProvider getProvider();

    protected abstract UriComponentsBuilder buildAuthorizationRequest();

    protected abstract OAuthUserProfile readUserProfile(String code);

    // =========================== Helpers ===========================

    protected String getRedirectUri() {
        return AppConfig.getFrontendClientUrl() + redirectUri;
    }

    protected void validateState(String state, String cookieStateToken) {
        if (StringUtils.isEmpty(state) || StringUtils.isEmpty(cookieStateToken) || !MessageDigest.isEqual(
                state.getBytes(StandardCharsets.UTF_8), cookieStateToken.getBytes(StandardCharsets.UTF_8))) {
            throw new BusinessException(INVALID_STATE_MESSAGE);
        }
    }

    private static String toSafeRedirect(String redirectUrl) {
        if (StringUtils.isEmpty(redirectUrl) || !redirectUrl.startsWith("/")
                || redirectUrl.startsWith("//") || redirectUrl.startsWith("/\\")) {
            return null;
        }

        return redirectUrl;
    }

    private static String encodeState(String state) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(state.getBytes(StandardCharsets.UTF_8));
    }

    private static String decodeState(String state) {
        try {
            return new String(Base64.getUrlDecoder().decode(state), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(INVALID_STATE_MESSAGE);
        }
    }
}
