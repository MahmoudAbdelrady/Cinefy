package com.mdevs.cinefy.job;

import com.mdevs.cinefy.repository.InvalidJwtRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class InvalidJwtCleanupJob {

    private static final int BATCH_SIZE = 100;

    private final InvalidJwtRepository invalidJwtRepository;

    @Scheduled(cron = "0 0 3 * * *")
    public void deleteExpiredInvalidJwts() {
        LocalDateTime now = LocalDateTime.now();
        int total = 0;
        int deleted;
        do {
            deleted = invalidJwtRepository.deleteExpiredBatch(now, BATCH_SIZE);
            total += deleted;
        } while (deleted == BATCH_SIZE);

        if (total > 0) {
            log.info("Invalid JWT cleanup: deleted {} expired entries", total);
        }
    }
}
