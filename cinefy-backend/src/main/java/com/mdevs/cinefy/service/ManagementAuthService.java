package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.ManagementLoginDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.entity.InvalidJwt;
import com.mdevs.cinefy.repository.InvalidJwtRepository;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.exception.types.UnauthorizedException;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
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

    private final InvalidJwtRepository invalidJwtRepository;

    @Value("${cinefy.jwt.refresh-token-rotation-threshold}")
    private long refreshTokenRotationThreshold;

    // ========================= Public API =========================

    public TokenPairDTO login(ManagementLoginDTO dto) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        String accessToken = jwtUtil.generateToken(TokenType.ACCESS, principal.getUuid(), principal.getPosition());
        String refreshToken = jwtUtil.generateToken(TokenType.REFRESH, principal.getUuid(), principal.getPosition());
        return new TokenPairDTO(accessToken, refreshToken);
    }

    @Transactional
    public void logout(String accessToken, String refreshToken) {
        blocklist(accessToken);
        blocklist(refreshToken);
    }

    @Transactional
    public TokenPairDTO refresh(String refreshToken) {
        Claims claims = jwtUtil.parseToken(refreshToken).getPayload();
        if (!jwtUtil.getTokenType(claims).equals(TokenType.REFRESH)) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        if (invalidJwtRepository.existsByJti(claims.getId())) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        String uuid = claims.getSubject();
        String position = claims.get(JwtUtil.CLAIM_POSITION, String.class);
        String newAccessToken = jwtUtil.generateToken(TokenType.ACCESS, uuid, position);

        String newRefreshToken = null;
        if (jwtUtil.getRemainingValidity(claims) < refreshTokenRotationThreshold) {
            newRefreshToken = jwtUtil.generateToken(TokenType.REFRESH, uuid, position);
            blocklist(refreshToken);
        }
        return new TokenPairDTO(newAccessToken, newRefreshToken);
    }

    // =========================== Helpers ===========================

    private void blocklist(String token) {
        Claims claims;
        try {
            claims = jwtUtil.parseToken(token).getPayload();
        } catch (JwtException ex) {
            return;
        }
        if (invalidJwtRepository.existsByJti(claims.getId())) {
            return;
        }

        InvalidJwt invalidJwt = new InvalidJwt();
        invalidJwt.setJti(claims.getId());
        invalidJwt.setType(jwtUtil.getTokenType(claims));
        invalidJwt.setExpirationDate(jwtUtil.getExpiration(claims));
        invalidJwtRepository.save(invalidJwt);
    }
}
