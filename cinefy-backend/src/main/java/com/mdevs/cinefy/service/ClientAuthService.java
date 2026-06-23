package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.dto.client.SignUpDTO;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.Otp;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.ClientRepository;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import com.mdevs.cinefy.shared.exception.types.ForbiddenException;
import com.mdevs.cinefy.shared.exception.types.UnauthorizedException;
import com.mdevs.cinefy.shared.security.CinefyAuthManagers;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
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

    private final InvalidJwtService invalidJwtService;

    @Value("${cinefy.jwt.refresh-token-rotation-threshold}")
    private long refreshTokenRotationThreshold;

    // ========================= Public API =========================

    public void signUp(SignUpDTO dto) {
        Client client = clientService.createClient(dto);
        sendVerificationOtp(client);
    }

    public TokenPairDTO login(LoginDTO dto) {
        Authentication authentication = authManagers.client().authenticate(new UsernamePasswordAuthenticationToken(dto.getEmail().trim().toLowerCase(), dto.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        Client client = clientRepository.findOne(principal.getId());
        if (!client.isVerified()) {
            sendVerificationOtp(client);
            throw new ForbiddenException("Account is not verified", ErrorCode.ACCOUNT_NOT_VERIFIED);
        }

        return generateTokens(client);
    }

    public void logout(String accessToken, String refreshToken) {
        // Losing the blocklist race here IS success
        invalidJwtService.tryInvalidate(accessToken);
        invalidJwtService.tryInvalidate(refreshToken);
    }

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

    public void verifyResetCode(OtpCodeDTO dto) {
        otpService.validate(dto.getCode(), OtpType.RESET_PASSWORD);
    }

    @Transactional
    public TokenPairDTO verifyClient(OtpCodeDTO dto) {
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

    private void sendVerificationOtp(Client client) {
        Otp otp;
        try {
            otp = otpService.create(client.getId(), UserType.CLIENT, OtpType.EMAIL_VERIFICATION);
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request already issued an active verification code for this user
            return;
        }

        emailService.sendEmailVerificationOtp(
                client.getEmail(),
                client.getFirstName(),
                otp.getCode(),
                otpService.getExpiryMinutes());
    }
}
