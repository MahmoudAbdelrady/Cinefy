package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.ManagementLoginDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.entity.InvalidJwt;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.repository.InvalidJwtRepository;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
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

    private final StaffMemberService staffMemberService;

    private final InvalidJwtRepository invalidJwtRepository;

    private static final String USER_TYPE_STAFF = "STAFF";

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
        StaffMember currentStaffMember = staffMemberService.getCurrentlyLoggedInStaffMember();
        blocklist(accessToken, currentStaffMember);
        blocklist(refreshToken, currentStaffMember);
    }

    // =========================== Helpers ===========================

    private void blocklist(String token, StaffMember staffMember) {
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
        if (staffMember != null) {
            invalidJwt.setUserId(staffMember.getId());
            invalidJwt.setUserType(USER_TYPE_STAFF);
        }
        invalidJwtRepository.save(invalidJwt);
    }
}
