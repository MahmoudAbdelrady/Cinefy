package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.OtpEntry;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.StaffPosition;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.StaffMemberRepository;
import com.mdevs.cinefy.shared.security.CinefyAuthManagers;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagementAuthService {

    private final CinefyAuthManagers authManagers;

    private final JwtUtil jwtUtil;

    private final OtpService otpService;

    private final EmailService emailService;

    private final StaffMemberService staffMemberService;

    private final StaffMemberRepository staffMemberRepository;

    // ========================= Public API =========================

    public TokenPairDTO login(LoginDTO dto) {
        Authentication authentication = authManagers.management().authenticate(new UsernamePasswordAuthenticationToken(dto.getEmail().trim().toLowerCase(), dto.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        JwtClaims jwtClaims = JwtClaims.fromPrincipal(principal);

        String accessToken = jwtUtil.generateToken(TokenType.ACCESS, jwtClaims);
        String refreshToken = jwtUtil.generateToken(TokenType.REFRESH, jwtClaims);
        return new TokenPairDTO(accessToken, refreshToken);
    }

    public void forgotPassword(ForgotPasswordDTO dto) {
        staffMemberRepository.findByEmail(dto.getEmail().trim().toLowerCase()).ifPresent(staffMember -> {
            if (staffMember.getPosition().equals(StaffPosition.ADMIN)) {
                return;
            }

            OtpEntry otp = otpService.create(staffMember.getId(), UserType.STAFF_MEMBER, OtpType.RESET_PASSWORD);
            if (otp == null) {
                return;
            }

            emailService.sendPasswordResetOtp(
                    staffMember.getEmail(),
                    staffMember.getFirstName(),
                    otp.code(),
                    otpService.getExpiryMinutes());
        });
    }

    public void verifyResetCode(OtpCodeDTO dto) {
        otpService.validate(dto.getCode(), OtpType.RESET_PASSWORD);
    }

    @Transactional
    public void resetPassword(ResetPasswordDTO dto) {
        otpService.validateAndConsume(dto.getCode(), OtpType.RESET_PASSWORD)
                .ifPresent(otp -> staffMemberService.updatePassword(otp.userId(), dto.getNewPassword()));
    }
}
