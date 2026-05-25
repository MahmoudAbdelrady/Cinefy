package com.mdevs.cinefy.job;

import com.mdevs.cinefy.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class OtpCleanupJob {

    private static final int BATCH_SIZE = 100;

    private final OtpRepository otpRepository;

    @Scheduled(cron = "0 0 3 * * *")
    public void deleteExpiredOtps() {
        LocalDateTime now = LocalDateTime.now();
        int total = 0;
        int deleted;
        do {
            deleted = otpRepository.deleteExpiredBatch(now, BATCH_SIZE);
            total += deleted;
        } while (deleted == BATCH_SIZE);

        if (total > 0) {
            log.info("OTP cleanup: deleted {} expired entries", total);
        }
    }
}
