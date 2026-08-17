package com.mdevs.cinefy.shared.oauth;

import com.mdevs.cinefy.entity.enums.OAuthProvider;
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
public class MicrosoftOAuthClient extends OAuthProviderClient {

    @Value("${cinefy.oauth.microsoft.client-id}")
    private String clientId;

    @Value("${cinefy.oauth.microsoft.client-secret}")
    private String clientSecret;

    private static final String AUTHORIZATION_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

    private static final String TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

    private static final String USER_INFO_URL = "https://graph.microsoft.com/v1.0/me";

    private static final String SIGN_IN_FAILED_MESSAGE = "Could not complete the sign-in with Microsoft";

    @Override
    protected OAuthProvider getProvider() {
        return OAuthProvider.MICROSOFT;
    }

    @Override
    protected UriComponentsBuilder buildAuthorizationRequest() {
        return UriComponentsBuilder.fromUriString(AUTHORIZATION_URL)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("response_mode", "query")
                .queryParam("scope", "openid email profile User.Read");
    }

    @Override
    protected OAuthUserProfile readUserProfile(String code) {
        return readProfile(requestAccessToken(code));
    }

    // =========================== Helpers ===========================

    private String requestAccessToken(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", getRedirectUri());
        form.add("grant_type", "authorization_code");

        JsonNode response = exchange(() -> restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(JsonNode.class));

        String accessToken = response == null ? null : response.path("access_token").asString(null);
        if (StringUtils.isEmpty(accessToken)) {
            log.warn("Microsoft token exchange returned no access token");
            throw new BusinessException(SIGN_IN_FAILED_MESSAGE);
        }

        return accessToken;
    }

    private OAuthUserProfile readProfile(String accessToken) {
        JsonNode response = exchange(() -> restClient.get()
                .uri(USER_INFO_URL)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(JsonNode.class));

        if (response == null) {
            log.warn("Microsoft user info returned an empty response");
            throw new BusinessException(SIGN_IN_FAILED_MESSAGE);
        }

        String email = response.path("mail").asString(null);
        if (StringUtils.isEmpty(email)) {
            email = response.path("userPrincipalName").asString(null);
        }

        if (StringUtils.isEmpty(email)) {
            log.warn("Microsoft user info returned no email");
            throw new BusinessException(SIGN_IN_FAILED_MESSAGE);
        }

        return new OAuthUserProfile(
                email,
                response.path("givenName").asString(null),
                response.path("surname").asString(null));
    }

    private JsonNode exchange(Supplier<JsonNode> request) {
        try {
            return request.get();
        } catch (HttpClientErrorException e) {
            log.warn("Microsoft sign-in request failed: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(SIGN_IN_FAILED_MESSAGE);
        } catch (RestClientException e) {
            log.warn("Microsoft sign-in request failed: {}", e.getMessage());
            throw new IllegalStateException(SIGN_IN_FAILED_MESSAGE);
        }
    }
}
