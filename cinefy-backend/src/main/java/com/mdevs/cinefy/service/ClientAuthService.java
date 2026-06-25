package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.SendOtpDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.dto.client.SignUpDTO;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.Otp;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.ClientRepository;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import com.mdevs.cinefy.shared.exception.types.ForbiddenException;
import com.mdevs.cinefy.shared.security.CinefyAuthManagers;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClientAuthService {

    private final CinefyAuthManagers authManagers;

    private final JwtUtil jwtUtil;

    private final ClientService clientService;

    private final ClientRepository clientRepository;

    private final OtpService otpService;

    private final EmailService emailService;

    // ========================= Public API =========================

    public void signUp(SignUpDTO dto) {
        Client client = clientService.createClient(dto);
        dispatchOtp(client, OtpType.EMAIL_VERIFICATION);
    }

    public TokenPairDTO login(LoginDTO dto) {
        Authentication authentication = authManagers.client().authenticate(new UsernamePasswordAuthenticationToken(dto.getEmail().trim().toLowerCase(), dto.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        Client client = clientRepository.findOne(principal.getId());
        if (!client.isVerified()) {
            dispatchOtp(client, OtpType.EMAIL_VERIFICATION);
            throw new ForbiddenException("Account is not verified", ErrorCode.ACCOUNT_NOT_VERIFIED);
        }

        return generateTokens(client);
    }

    public void forgotPassword(ForgotPasswordDTO dto) {
        issueOtpByEmail(dto.getEmail(), OtpType.RESET_PASSWORD);
    }

    public void sendOtp(SendOtpDTO dto) {
        issueOtpByEmail(dto.getEmail(), OtpType.fromString(dto.getOtpType()));
    }

    public void verifyResetCode(OtpCodeDTO dto) {
        otpService.validate(dto.getCode(), OtpType.RESET_PASSWORD);
    }

    @Transactional
    public void resetPassword(ResetPasswordDTO dto) {
        Otp otp = otpService.validate(dto.getCode(), OtpType.RESET_PASSWORD);
        clientService.updatePassword(otp.getUserId(), dto.getNewPassword());
        otpService.consume(otp);
    }

    @Transactional
    public TokenPairDTO verifyAccount(OtpCodeDTO dto) {
        Otp otp = otpService.validate(dto.getCode(), OtpType.EMAIL_VERIFICATION);
        Client client = clientService.markVerified(otp.getUserId());
        otpService.consume(otp);
        return generateTokens(client);
    }

    // =========================== Helpers ===========================

    private TokenPairDTO generateTokens(Client client) {
        JwtClaims jwtClaims = JwtClaims.fromPrincipal(UserPrincipal.fromClient(client));
        String accessToken = jwtUtil.generateToken(TokenType.ACCESS, jwtClaims);
        String refreshToken = jwtUtil.generateToken(TokenType.REFRESH, jwtClaims);
        return new TokenPairDTO(accessToken, refreshToken);
    }

    private void issueOtpByEmail(String email, OtpType otpType) {
        clientRepository.findByEmail(email.trim().toLowerCase()).ifPresent(client -> {
            if (otpType.equals(OtpType.EMAIL_VERIFICATION) && client.isVerified()) {
                return;
            }
            dispatchOtp(client, otpType);
        });
    }

    private void dispatchOtp(Client client, OtpType otpType) {
        // TODO: Will be moved to Redis - SET NX approach
        Otp otp;
        try {
            otp = otpService.create(client.getId(), UserType.CLIENT, otpType);
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request already issued an active code of this type for this user
            return;
        }

        switch (otpType) {
            case EMAIL_VERIFICATION -> emailService.sendEmailVerificationOtp(
                    client.getEmail(),
                    client.getFirstName(),
                    otp.getCode(),
                    otpService.getExpiryMinutes());
            case RESET_PASSWORD -> emailService.sendPasswordResetOtp(
                    client.getEmail(),
                    client.getFirstName(),
                    otp.getCode(),
                    otpService.getExpiryMinutes());
        }
    }
}
