package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.entity.Otp;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.StaffPosition;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.StaffMemberRepository;
import com.mdevs.cinefy.shared.security.CinefyAuthManagers;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.exception.types.UnauthorizedException;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagementAuthService {

    private final CinefyAuthManagers authManagers;

    private final JwtUtil jwtUtil;

    private final InvalidJwtService invalidJwtService;

    private final OtpService otpService;

    private final EmailService emailService;

    private final StaffMemberService staffMemberService;

    private final StaffMemberRepository staffMemberRepository;

    @Value("${cinefy.jwt.refresh-token-rotation-threshold}")
    private long refreshTokenRotationThreshold;

    // ========================= Public API =========================

    public boolean isRefreshTokenValid(String refreshToken) {
        Claims claims;
        try {
            claims = jwtUtil.parseToken(refreshToken).getPayload();
        } catch (JwtException ex) {
            return false;
        }
        return jwtUtil.getTokenType(claims).equals(TokenType.REFRESH) && !invalidJwtService.isBlocklisted(claims.getId());
    }

    public TokenPairDTO login(LoginDTO dto) {
        Authentication authentication = authManagers.management().authenticate(new UsernamePasswordAuthenticationToken(dto.getEmail().trim().toLowerCase(), dto.getPassword()));
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

    public void forgotPassword(ForgotPasswordDTO dto) {
        staffMemberRepository.findByEmail(dto.getEmail().trim().toLowerCase()).ifPresent(staffMember -> {
            if (staffMember.getPosition().equals(StaffPosition.ADMIN)) {
                return;
            }

            // TODO: Will be moved to Redis - SET NX approach
            Otp otp;
            try {
                otp = otpService.create(staffMember.getId(), UserType.STAFF_MEMBER, OtpType.RESET_PASSWORD);
            } catch (DataIntegrityViolationException ex) {
                // A concurrent request already issued an active reset code for this user
                return;
            }

            emailService.sendPasswordResetOtp(
                    staffMember.getEmail(),
                    staffMember.getFirstName(),
                    otp.getCode(),
                    otpService.getExpiryMinutes());
        });
    }

    public void verifyResetCode(OtpCodeDTO dto) {
        otpService.validate(dto.getCode(), OtpType.RESET_PASSWORD);
    }

    @Transactional
    public void resetPassword(ResetPasswordDTO dto) {
        Otp otp = otpService.validate(dto.getCode(), OtpType.RESET_PASSWORD);
        staffMemberService.updatePassword(otp.getUserId(), dto.getNewPassword());
        otpService.consume(otp);
    }
}
