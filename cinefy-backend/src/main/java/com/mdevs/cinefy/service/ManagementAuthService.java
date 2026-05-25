package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.ManagementLoginDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.exception.types.UnauthorizedException;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagementAuthService {

    @Qualifier("managementAuthenticationManager")
    private final AuthenticationManager authenticationManager;

    private final JwtUtil jwtUtil;

    private final InvalidJwtService invalidJwtService;

    @Value("${cinefy.jwt.refresh-token-rotation-threshold}")
    private long refreshTokenRotationThreshold;

    // ========================= Public API =========================

    public TokenPairDTO login(ManagementLoginDTO dto) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        JwtClaims jwtClaims = JwtClaims.fromPrincipal(principal);

        String accessToken = jwtUtil.generateToken(TokenType.ACCESS, jwtClaims);
        String refreshToken = jwtUtil.generateToken(TokenType.REFRESH, jwtClaims);
        return new TokenPairDTO(accessToken, refreshToken);
    }

    public void logout(String accessToken, String refreshToken) {
        // Losing the blocklist race here IS success
        invalidJwtService.tryInvalidate(accessToken);
        invalidJwtService.tryInvalidate(refreshToken);
    }

    @Transactional
    public TokenPairDTO refresh(String refreshToken) {
        Claims claims = jwtUtil.parseToken(refreshToken).getPayload();
        if (!jwtUtil.getTokenType(claims).equals(TokenType.REFRESH) || invalidJwtService.isBlocklisted(claims.getId())) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        JwtClaims jwtClaims = JwtClaims.from(claims);
        String newAccessToken = jwtUtil.generateToken(TokenType.ACCESS, jwtClaims);

        String newRefreshToken = null;
        if (jwtUtil.getRemainingValidity(claims) < refreshTokenRotationThreshold) {
            // Claim the old token first. If a concurrent refresh already consumed it, reject.
            if (!invalidJwtService.tryInvalidate(refreshToken)) {
                throw new UnauthorizedException("Invalid refresh token");
            }
            newRefreshToken = jwtUtil.generateToken(TokenType.REFRESH, jwtClaims);
        }
        return new TokenPairDTO(newAccessToken, newRefreshToken);
    }
}
