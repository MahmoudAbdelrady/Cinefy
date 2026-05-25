package com.mdevs.cinefy.service;

import com.mdevs.cinefy.entity.Otp;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.OtpRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;

    @Value("${cinefy.otp.expiration}")
    private long expirationMillis;

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final int MAX_CODE_GENERATION_ATTEMPTS = 5;

    // ========================= Public API =========================

    public Otp validate(String code, OtpType type) {
        Otp otp = otpRepository.findByCodeAndType(code, type)
                .orElseThrow(() -> new BusinessException("Invalid code"));
        if (otp.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Code has expired");
        }
        return otp;
    }

    @Transactional
    public Otp generate(Long userId, UserType userType, OtpType type) {
        Otp otp = new Otp();
        otp.setType(type);
        otp.setUserId(userId);
        otp.setUserType(userType);
        otp.setExpirationDate(LocalDateTime.now().plus(Duration.ofMillis(expirationMillis)));

        for (int attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
            otp.setCode(generateCode());
            try {
                return otpRepository.saveAndFlush(otp);
            } catch (DataIntegrityViolationException ex) {
                // Unique-code collision; retry with a fresh code.
            }
        }
        throw new BusinessException("Could not generate a unique code");
    }

    @Transactional
    public void deleteActiveFor(Long userId, UserType userType, OtpType type) {
        otpRepository.deleteByUserIdAndUserTypeAndTypeAndExpirationDateAfter(userId, userType, type, LocalDateTime.now());
    }

    @Transactional
    public void consume(Otp otp) {
        otpRepository.delete(otp);
    }

    // =========================== Helpers ===========================

    private String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}
