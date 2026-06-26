package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.service.JwtSessionService;
import com.mdevs.cinefy.service.ManagementAuthService;
import com.mdevs.cinefy.shared.security.AuthCookieResponseFactory;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/management/auth")
@RequiredArgsConstructor
public class ManagementAuthController {

    private final ManagementAuthService managementAuthService;

    private final JwtSessionService jwtSessionService;

    private final AuthCookieResponseFactory authCookieResponseFactory;

    private static final String AUTH_PATH = "/management/auth";

    @PublicApi
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginDTO dto) {
        TokenPairDTO tokens = managementAuthService.login(dto);
        return authCookieResponseFactory.tokenResponse(tokens, AUTH_PATH);
    }

    @PublicApi
    @GetMapping("/session")
    public ResponseEntity<Void> session(@CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
        boolean valid = jwtSessionService.isRefreshTokenValid(refreshToken);
        return valid ? ResponseEntity.ok().build() : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PublicApi
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(@CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
        TokenPairDTO tokens = jwtSessionService.refresh(refreshToken);
        return authCookieResponseFactory.tokenResponse(tokens, AUTH_PATH);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = JwtUtil.ACCESS_TOKEN_COOKIE) String accessToken,
                                       @CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE) String refreshToken) {
        jwtSessionService.logout(accessToken, refreshToken);
        return authCookieResponseFactory.logoutResponse(AUTH_PATH);
    }

    @PublicApi
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        managementAuthService.forgotPassword(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Void> verifyResetCode(@Valid @RequestBody OtpCodeDTO dto) {
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
