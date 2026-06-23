package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.dto.client.SignUpDTO;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.Otp;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
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

@Service
@RequiredArgsConstructor
public class ClientAuthService {

    private final CinefyAuthManagers authManagers;

    private final JwtUtil jwtUtil;

    private final ClientService clientService;

    private final OtpService otpService;

    private final EmailService emailService;

    public void signUp(SignUpDTO dto) {
        Client client = clientService.createClient(dto);

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

    public TokenPairDTO login(LoginDTO dto) {
        Authentication authentication = authManagers.client().authenticate(new UsernamePasswordAuthenticationToken(dto.getEmail().trim().toLowerCase(), dto.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        JwtClaims jwtClaims = JwtClaims.fromPrincipal(principal);

        String accessToken = jwtUtil.generateToken(TokenType.ACCESS, jwtClaims);
        String refreshToken = jwtUtil.generateToken(TokenType.REFRESH, jwtClaims);
        return new TokenPairDTO(accessToken, refreshToken);
    }
}
