package com.mdevs.cinefy.service;

import com.mdevs.cinefy.entity.InvalidJwt;
import com.mdevs.cinefy.repository.InvalidJwtRepository;
import com.mdevs.cinefy.shared.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class InvalidJwtService {

    private final JwtUtil jwtUtil;

    private final InvalidJwtRepository invalidJwtRepository;

    @Lazy
    private final InvalidJwtService self;

    // ========================= Public API =========================

    public boolean isBlocklisted(String jti) {
        return invalidJwtRepository.existsByJti(jti);
    }

    public boolean tryInvalidate(String token) {
        try {
            return self.blocklist(token);
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request may blocklist the same jti and the token is already invalidated
            return false;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean blocklist(String token) {
        Claims claims;
        try {
            claims = jwtUtil.parseToken(token).getPayload();
        } catch (JwtException ex) {
            return false;
        }
        if (invalidJwtRepository.existsByJti(claims.getId())) {
            return false;
        }

        InvalidJwt invalidJwt = new InvalidJwt();
        invalidJwt.setJti(claims.getId());
        invalidJwt.setType(jwtUtil.getTokenType(claims));
        invalidJwt.setExpirationDate(jwtUtil.getExpiration(claims));
        invalidJwtRepository.saveAndFlush(invalidJwt);
        return true;
    }

    @Transactional
    public int deleteExpiredBatch(Instant cutoffDate, int batchSize) {
        return invalidJwtRepository.deleteExpiredBatch(cutoffDate, batchSize);
    }
}
