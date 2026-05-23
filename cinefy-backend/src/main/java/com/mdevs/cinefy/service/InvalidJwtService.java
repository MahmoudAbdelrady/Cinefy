package com.mdevs.cinefy.service;

import com.mdevs.cinefy.entity.InvalidJwt;
import com.mdevs.cinefy.repository.InvalidJwtRepository;
import com.mdevs.cinefy.shared.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvalidJwtService {

    private final JwtUtil jwtUtil;

    private final InvalidJwtRepository invalidJwtRepository;

    // ========================= Public API =========================

    public boolean isBlocklisted(String jti) {
        return invalidJwtRepository.existsByJti(jti);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void blocklist(String token) {
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
        try {
            invalidJwtRepository.saveAndFlush(invalidJwt);
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request blocklisted the same jti — the token is already invalidated, so this is a no-op rather than an error.
        }
    }
}
