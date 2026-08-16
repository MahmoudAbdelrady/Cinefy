package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OAuthCallbackDTO;
import com.mdevs.cinefy.dto.auth.OAuthCallbackResultDTO;
import com.mdevs.cinefy.dto.auth.OAuthRegistrationDTO;
import com.mdevs.cinefy.dto.auth.OAuthSignUpDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.SendOtpDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.dto.client.SignUpDTO;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.Otp;
import com.mdevs.cinefy.entity.enums.OAuthProvider;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.ClientRepository;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.ForbiddenException;
import com.mdevs.cinefy.shared.oauth.OAuthAuthorizationDTO;
import com.mdevs.cinefy.shared.oauth.OAuthProviderClient;
import com.mdevs.cinefy.shared.oauth.OAuthProviderClientFactory;
import com.mdevs.cinefy.shared.oauth.OAuthRegistrationToken;
import com.mdevs.cinefy.shared.oauth.OAuthState;
import com.mdevs.cinefy.shared.oauth.OAuthUserProfile;
import com.mdevs.cinefy.shared.security.CinefyAuthManagers;
import com.mdevs.cinefy.shared.security.CredentialCipher;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClientAuthService {

    private final CinefyAuthManagers authManagers;

    private final JwtUtil jwtUtil;

    private final ClientService clientService;

    private final ClientRepository clientRepository;

    private final OtpService otpService;

    private final EmailService emailService;

    private final OAuthProviderClientFactory oAuthProviderClientFactory;

    private final CredentialCipher credentialCipher;

    private final ObjectMapper objectMapper;

    @Value("${cinefy.oauth.registration-token-expiration-minutes}")
    private int oAuthRegistrationTokenExpirationMinutes;

    // ========================= Public API =========================

    public OAuthAuthorizationDTO getOAuthAuthorizationUrl(String provider) {
        return resolveOAuthClient(provider).getAuthorizationUrl();
    }

    public void signUp(SignUpDTO dto) {
        Client client = clientService.createClient(dto);
        dispatchOtp(client, OtpType.EMAIL_VERIFICATION);
    }

    public OAuthCallbackResultDTO handleOAuthCallback(OAuthCallbackDTO dto, String cookieStateToken) {
        OAuthState state = OAuthProviderClient.parseState(dto.getState());
        OAuthUserProfile profile = resolveOAuthClient(state.provider()).exchangeCode(dto.getCode(), state.token(), cookieStateToken);
        if (profile == null || StringUtils.isEmpty(profile.email())) {
            throw new BusinessException("Could not read the account details from the provider");
        }

        return clientRepository.findByEmail(profile.email().trim().toLowerCase())
                .map(client -> {
                    if (!client.isVerified()) {
                        dispatchOtp(client, OtpType.EMAIL_VERIFICATION);
                        throw new ForbiddenException("Account is not verified", ErrorCode.ACCOUNT_NOT_VERIFIED);
                    }
                    return OAuthCallbackResultDTO.signedIn(generateTokens(client));
                })
                .orElseGet(() -> OAuthCallbackResultDTO.registrationRequired(new OAuthRegistrationDTO(
                        issueRegistrationToken(profile),
                        profile.email(),
                        profile.firstName(),
                        profile.lastName()
                )));
    }

    public TokenPairDTO oAuthSignUp(OAuthSignUpDTO dto) {
        OAuthRegistrationToken token = parseRegistrationToken(dto.getRegistrationToken());
        Client client = clientService.createOAuthClient(token, dto.getPhoneNumber());
        return generateTokens(client);
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

    public void sendOtp(SendOtpDTO dto) {
        OtpType otpType = OtpType.fromString(dto.getOtpType());
        clientRepository.findByEmail(dto.getEmail().trim().toLowerCase()).ifPresent(client -> {
            if (otpType.equals(OtpType.EMAIL_VERIFICATION) && client.isVerified()) {
                return;
            }
            dispatchOtp(client, otpType);
        });
    }

    public void verifyOtp(OtpCodeDTO dto) {
        if (StringUtils.isEmpty(dto.getOtpType())) {
            throw new BusinessException("Otp Type is required");
        }
        otpService.validate(dto.getCode(), OtpType.fromString(dto.getOtpType()));
    }

    @Transactional
    public void resetPassword(ResetPasswordDTO dto) {
        otpService.validateAndConsume(dto.getCode(), OtpType.RESET_PASSWORD)
                .ifPresent(otp -> clientService.updatePassword(otp.getUserId(), dto.getNewPassword()));
    }

    @Transactional
    public Optional<TokenPairDTO> verifyAccount(OtpCodeDTO dto) {
        return otpService.validateAndConsume(dto.getCode(), OtpType.EMAIL_VERIFICATION)
                .map(otp -> generateTokens(clientService.markVerified(otp.getUserId())));
    }

    // =========================== Helpers ===========================

    private OAuthProviderClient resolveOAuthClient(String provider) {
        return oAuthProviderClientFactory.getClient(OAuthProvider.fromString(provider));
    }

    private String issueRegistrationToken(OAuthUserProfile profile) {
        OAuthRegistrationToken token = new OAuthRegistrationToken(
                profile.email(),
                profile.firstName(),
                profile.lastName(),
                LocalDateTime.now().plusMinutes(oAuthRegistrationTokenExpirationMinutes));
        return credentialCipher.encrypt(objectMapper.writeValueAsString(token));
    }

    private OAuthRegistrationToken parseRegistrationToken(String token) {
        OAuthRegistrationToken parsed;
        try {
            parsed = objectMapper.readValue(credentialCipher.decrypt(token), OAuthRegistrationToken.class);
        } catch (Exception ex) {
            throw new BusinessException("Invalid or expired registration token");
        }

        if (parsed.expiresAt() == null || parsed.expiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Invalid or expired registration token");
        }

        return parsed;
    }

    private TokenPairDTO generateTokens(Client client) {
        JwtClaims jwtClaims = JwtClaims.fromPrincipal(UserPrincipal.fromClient(client));
        String accessToken = jwtUtil.generateToken(TokenType.ACCESS, jwtClaims);
        String refreshToken = jwtUtil.generateToken(TokenType.REFRESH, jwtClaims);
        return new TokenPairDTO(accessToken, refreshToken);
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
