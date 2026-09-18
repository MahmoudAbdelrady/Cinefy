package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.shared.exception.types.UnauthorizedException;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JwtSessionService {

    private final JwtUtil jwtUtil;

    private final InvalidJwtService invalidJwtService;

    @Value("${cinefy.jwt.refresh-token-rotation-threshold}")
    private long refreshTokenRotationThreshold;

    // ========================= Public API =========================

    public boolean isRefreshTokenValid(String refreshToken) {
        if (StringUtils.isEmpty(refreshToken)) {
            return false;
        }
        Claims claims;
        try {
            claims = jwtUtil.parseToken(refreshToken).getPayload();
        } catch (JwtException ex) {
            return false;
        }
        return jwtUtil.getTokenType(claims).equals(TokenType.REFRESH) && !invalidJwtService.isBlocklisted(claims.getId());
    }

    public void logout(String accessToken, String refreshToken) {
        // Losing the blocklist race here IS success
        if (StringUtils.isNotEmpty(accessToken)) {
            invalidJwtService.tryInvalidate(accessToken);
        }
        if (StringUtils.isNotEmpty(refreshToken)) {
            invalidJwtService.tryInvalidate(refreshToken);
        }
    }

    @Transactional
    public TokenPairDTO refresh(String refreshToken) {
        if (StringUtils.isEmpty(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }
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
