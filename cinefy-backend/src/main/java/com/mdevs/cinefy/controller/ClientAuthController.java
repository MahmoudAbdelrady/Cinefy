package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.SendOtpDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.dto.client.SignUpDTO;
import com.mdevs.cinefy.service.ClientAuthService;
import com.mdevs.cinefy.service.JwtSessionService;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import com.mdevs.cinefy.shared.security.AuthCookieResponseFactory;
import com.mdevs.cinefy.shared.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/clients/auth")
@RequiredArgsConstructor
public class ClientAuthController {

    private final ClientAuthService clientAuthService;

    private final JwtSessionService jwtSessionService;

    private final AuthCookieResponseFactory authCookieResponseFactory;

    private static final String AUTH_PATH = "/clients/auth";

    @PublicApi
    @PostMapping("/sign-up")
    public ResponseEntity<Void> signUp(@Valid @RequestBody SignUpDTO dto) {
        clientAuthService.signUp(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PublicApi
    @PostMapping("/send-otp")
    public ResponseEntity<Void> sendOtp(@Valid @RequestBody SendOtpDTO dto) {
        clientAuthService.sendOtp(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        clientAuthService.forgotPassword(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Void> verifyResetCode(@Valid @RequestBody OtpCodeDTO dto) {
        clientAuthService.verifyResetCode(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        clientAuthService.resetPassword(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/verify-account")
    public ResponseEntity<Void> verifyAccount(@Valid @RequestBody OtpCodeDTO dto) {
        TokenPairDTO tokens = clientAuthService.verifyAccount(dto);
        return authCookieResponseFactory.tokenResponse(tokens, AUTH_PATH);
    }

    @PublicApi
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginDTO dto) {
        TokenPairDTO tokens = clientAuthService.login(dto);
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
}
