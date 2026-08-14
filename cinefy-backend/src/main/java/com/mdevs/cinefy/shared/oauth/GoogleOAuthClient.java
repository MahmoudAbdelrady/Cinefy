package com.mdevs.cinefy.shared.oauth;

import com.mdevs.cinefy.config.general.AppConfig;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.JsonNode;

import java.util.function.Supplier;

@Slf4j
@Component
public class GoogleOAuthClient extends OAuthProviderClient {

    @Value("${cinefy.oauth.google.client-id}")
    private String clientId;

    @Value("${cinefy.oauth.google.client-secret}")
    private String clientSecret;

    @Value("${cinefy.oauth.google.redirect-uri}")
    private String redirectUri;

    private static final String AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";

    private static final String USER_INFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

    private static final String SIGN_IN_FAILED_MESSAGE = "Could not complete the sign-in with Google";

    @Override
    public OAuthAuthorizationDTO getAuthorizationUrl() {
        String stateToken = issueState();
        String authorizationUrl = UriComponentsBuilder.fromUriString(AUTHORIZATION_URL)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", AppConfig.getFrontendClientUrl() + redirectUri)
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
        return readUserProfile(requestAccessToken(code));
    }

    // =========================== Helpers ===========================

    private String requestAccessToken(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");

        JsonNode response = exchange(() -> restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(JsonNode.class));

        String accessToken = response == null ? null : response.path("access_token").asString(null);
        if (StringUtils.isEmpty(accessToken)) {
            log.warn("Google token exchange returned no access token");
            throw new BusinessException(SIGN_IN_FAILED_MESSAGE);
        }

        return accessToken;
    }

    private OAuthUserProfile readUserProfile(String accessToken) {
        JsonNode response = exchange(() -> restClient.get()
                .uri(USER_INFO_URL)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(JsonNode.class));

        if (response == null) {
            log.warn("Google user info returned an empty response");
            throw new BusinessException(SIGN_IN_FAILED_MESSAGE);
        }

        String email = response.path("email").asString(null);
        if (StringUtils.isEmpty(email)) {
            log.warn("Google user info returned no email");
            throw new BusinessException(SIGN_IN_FAILED_MESSAGE);
        }

        return new OAuthUserProfile(
                email,
                response.path("given_name").asString(null),
                response.path("family_name").asString(null));
    }

    private JsonNode exchange(Supplier<JsonNode> request) {
        try {
            return request.get();
        } catch (HttpClientErrorException e) {
            log.warn("Google sign-in request failed: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(SIGN_IN_FAILED_MESSAGE);
        } catch (RestClientException e) {
            log.warn("Google sign-in request failed: {}", e.getMessage());
            throw new IllegalStateException(SIGN_IN_FAILED_MESSAGE);
        }
    }
}
