package com.mdevs.cinefy.service;

import com.mdevs.cinefy.entity.Otp;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.OtpRepository;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;

    @Value("${cinefy.otp.expiration}")
    private long expirationMillis;

    private static final SecureRandom RANDOM = new SecureRandom();

    // ========================= Public API =========================

    public int getExpiryMinutes() {
        return (int) Duration.ofMillis(expirationMillis).toMinutes();
    }

    public Otp validate(String code, OtpType type) {
        Otp otp = otpRepository.findByCodeAndType(code, type)
                .orElseThrow(() -> new BusinessException("Invalid or expired code", ErrorCode.OTP_INVALID));
        if (otp.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Invalid or expired code", ErrorCode.OTP_INVALID);
        }
        return otp;
    }

    @Transactional
    public Optional<Otp> validateAndConsume(String code, OtpType type) {
        Otp otp = validate(code, type);
        return consume(otp) ? Optional.of(otp) : Optional.empty();
    }

    /**
     * @throws org.springframework.dao.DataIntegrityViolationException if a concurrent caller already issued an OTP
     */
    @Transactional
    public Otp create(Long userId, UserType userType, OtpType type) {
        otpRepository.deleteByUserIdAndUserTypeAndType(userId, userType, type);

        Otp otp = new Otp();
        otp.setCode(generateUniqueCode());
        otp.setType(type);
        otp.setUserId(userId);
        otp.setUserType(userType);
        otp.setExpirationDate(LocalDateTime.now().plusMinutes(getExpiryMinutes()));
        return otpRepository.saveAndFlush(otp);
    }

    @Transactional
    public boolean consume(Otp otp) {
        return otpRepository.deleteByIdReturningCount(otp.getId()) == 1;
    }

    @Transactional
    public int deleteExpiredBatch(LocalDateTime cutoffDate, int batchSize) {
        return otpRepository.deleteExpiredBatch(cutoffDate, batchSize);
    }

    // =========================== Helpers ===========================

    private String generateUniqueCode() {
        String code;
        do {
            code = String.format("%06d", RANDOM.nextInt(1_000_000));
        } while (otpRepository.existsByCode(code));
        return code;
    }
}
