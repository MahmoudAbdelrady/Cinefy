package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.dto.auth.VerifyResetCodeDTO;
import com.mdevs.cinefy.service.ManagementAuthService;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import com.mdevs.cinefy.utils.CookieUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/management/auth")
@RequiredArgsConstructor
public class ManagementAuthController {

    private final ManagementAuthService managementAuthService;

    private final CookieUtil cookieUtil;

    @Value("${cinefy.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${cinefy.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private static final String AUTH_PATH = "/management/auth";

    @PublicApi
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginDTO dto) {
        TokenPairDTO tokens = managementAuthService.login(dto);

        ResponseCookie accessTokenCookie = cookieUtil.buildAccessTokenCookie(tokens.accessToken(), accessTokenExpiration);
        ResponseCookie refreshTokenCookie = cookieUtil.buildRefreshTokenCookie(tokens.refreshToken(), refreshTokenExpiration, AUTH_PATH);
        ResponseCookie csrfTokenCookie = cookieUtil.buildCsrfTokenCookie(UUID.randomUUID().toString(), refreshTokenExpiration);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, csrfTokenCookie.toString())
                .build();
    }

    @PublicApi
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(@CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
        TokenPairDTO tokens = managementAuthService.refresh(refreshToken);

        ResponseCookie accessTokenCookie = cookieUtil.buildAccessTokenCookie(tokens.accessToken(), accessTokenExpiration);
        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());

        if (StringUtils.isNotEmpty(tokens.refreshToken())) {
            ResponseCookie refreshTokenCookie = cookieUtil.buildRefreshTokenCookie(tokens.refreshToken(), refreshTokenExpiration, AUTH_PATH);
            ResponseCookie csrfTokenCookie = cookieUtil.buildCsrfTokenCookie(UUID.randomUUID().toString(), refreshTokenExpiration);
            responseBuilder.header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
            responseBuilder.header(HttpHeaders.SET_COOKIE, csrfTokenCookie.toString());
        }

        return responseBuilder.build();
    }

    @PublicApi
    @GetMapping("/session")
    public ResponseEntity<Void> session(@CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
        boolean valid = StringUtils.isNotEmpty(refreshToken) && managementAuthService.isRefreshTokenValid(refreshToken);
        return valid ? ResponseEntity.ok().build() : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = JwtUtil.ACCESS_TOKEN_COOKIE) String accessToken,
                                       @CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE) String refreshToken) {
        managementAuthService.logout(accessToken, refreshToken);

        ResponseCookie clearedAccessTokenCookie = cookieUtil.buildAccessTokenCookie("", 0);
        ResponseCookie clearedRefreshTokenCookie = cookieUtil.buildRefreshTokenCookie("", 0, AUTH_PATH);
        ResponseCookie clearedCsrfTokenCookie = cookieUtil.buildCsrfTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearedAccessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearedRefreshTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearedCsrfTokenCookie.toString())
                .build();
    }

    @PublicApi
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        managementAuthService.forgotPassword(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Void> verifyResetCode(@Valid @RequestBody VerifyResetCodeDTO dto) {
        managementAuthService.verifyResetCode(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        managementAuthService.resetPassword(dto);
        return ResponseEntity.noContent().build();
    }
}
