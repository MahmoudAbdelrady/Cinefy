package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.utils.CookieUtil;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuthCookieResponseFactory {

    private final CookieUtil cookieUtil;

    @Value("${cinefy.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${cinefy.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public ResponseEntity<Void> tokenResponse(TokenPairDTO tokens, String refreshTokenPath) {
        return tokenResponse(tokens, refreshTokenPath, List.of());
    }

    public ResponseEntity<Void> tokenResponse(TokenPairDTO tokens, String refreshTokenPath, List<ResponseCookie> additionalCookies) {
        ResponseCookie accessTokenCookie = cookieUtil.buildAccessTokenCookie(tokens.accessToken(), accessTokenExpiration);
        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());

        if (StringUtils.isNotEmpty(tokens.refreshToken())) {
            ResponseCookie refreshTokenCookie = cookieUtil.buildRefreshTokenCookie(tokens.refreshToken(), refreshTokenExpiration, refreshTokenPath);
            ResponseCookie csrfTokenCookie = cookieUtil.buildCsrfTokenCookie(UUID.randomUUID().toString(), refreshTokenExpiration);
            responseBuilder.header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
            responseBuilder.header(HttpHeaders.SET_COOKIE, csrfTokenCookie.toString());
        }

        for (ResponseCookie additionalCookie : additionalCookies) {
            responseBuilder.header(HttpHeaders.SET_COOKIE, additionalCookie.toString());
        }

        return responseBuilder.build();
    }

    public ResponseEntity<Void> logoutResponse(String refreshTokenPath) {
        ResponseCookie clearedAccessTokenCookie = cookieUtil.buildAccessTokenCookie("", 0);
        ResponseCookie clearedRefreshTokenCookie = cookieUtil.buildRefreshTokenCookie("", 0, refreshTokenPath);
        ResponseCookie clearedCsrfTokenCookie = cookieUtil.buildCsrfTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearedAccessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearedRefreshTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearedCsrfTokenCookie.toString())
                .build();
    }
}
