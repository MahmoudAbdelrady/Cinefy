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
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * Blocklists a token, returning whether THIS caller won (false = already invalidated by a concurrent
     * request). Non-transactional on purpose: a lost race poisons blocklist()'s REQUIRES_NEW tx and throws
     * {@link UnexpectedRollbackException} at its commit, which must be caught out here, outside that boundary.
     */
    public boolean tryInvalidate(String token) {
        try {
            return self.blocklist(token);
        } catch (UnexpectedRollbackException ex) {
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
        try {
            invalidJwtRepository.saveAndFlush(invalidJwt);
            return true;
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request blocklisted the same jti and the token is already invalidated.
            return false;
        }
    }
}
