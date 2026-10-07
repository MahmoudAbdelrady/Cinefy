package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.OtpEntry;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final CacheService cacheService;

    @Value("${cinefy.otp.expiration-minutes}")
    private int expirationMinutes;

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String CODE_KEY_PREFIX = "otp:code:";

    private static final String USER_KEY_PREFIX = "otp:user:";

    private static final String COOLDOWN_KEY_PREFIX = "otp:cooldown:";

    // ========================= Public API =========================

    public int getExpiryMinutes() {
        return expirationMinutes;
    }

    public OtpEntry validate(String code, OtpType type) {
        if (!(cacheService.get(codeKey(code)) instanceof OtpEntry otp) || otp.type() != type) {
            throw new BusinessException("Invalid or expired code", ErrorCode.OTP_INVALID);
        }
        return otp;
    }

    public OtpEntry create(Long userId, UserType userType, OtpType type) {
        if (!cacheService.addIfAbsent(userScopedKey(COOLDOWN_KEY_PREFIX, userId, userType, type), true, Duration.ofMillis(100))) {
            return null;
        }

        Duration ttl = Duration.ofMinutes(expirationMinutes);
        OtpEntry otp = insertWithUniqueCode(userId, userType, type, ttl);
        String userKey = userScopedKey(USER_KEY_PREFIX, userId, userType, type);
        String previousCode = cacheService.get(userKey) instanceof String code ? code : null;
        cacheService.add(userKey, otp.code(), ttl);
        if (previousCode != null) {
            cacheService.delete(codeKey(previousCode));
        }
        return otp;
    }

    public void consume(OtpEntry otp) {
        if (!cacheService.delete(codeKey(otp.code()))) {
            throw new BusinessException("Invalid or expired code", ErrorCode.OTP_INVALID);
        }

        cacheService.delete(userScopedKey(USER_KEY_PREFIX, otp.userId(), otp.userType(), otp.type()));
        cacheService.delete(userScopedKey(COOLDOWN_KEY_PREFIX, otp.userId(), otp.userType(), otp.type()));
    }

    // =========================== Helpers ===========================

    private OtpEntry insertWithUniqueCode(Long userId, UserType userType, OtpType type, Duration ttl) {
        OtpEntry otp;
        do {
            otp = new OtpEntry(generateCode(), userId, userType, type);
        } while (!cacheService.addIfAbsent(codeKey(otp.code()), otp, ttl));
        return otp;
    }

    private String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String codeKey(String code) {
        return CODE_KEY_PREFIX + code;
    }

    private String userScopedKey(String prefix, Long userId, UserType userType, OtpType type) {
        return prefix + userId + ":" + userType + ":" + type;
    }
}
