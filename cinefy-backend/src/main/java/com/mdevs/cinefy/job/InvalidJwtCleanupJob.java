package com.mdevs.cinefy.job;

import com.mdevs.cinefy.repository.InvalidJwtRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class InvalidJwtCleanupJob {

    private final InvalidJwtRepository invalidJwtRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void deleteExpiredInvalidJwts() {
        int deleted = invalidJwtRepository.deleteExpired(LocalDateTime.now());
        if (deleted > 0) {
            log.info("Invalid JWT cleanup: deleted {} expired entries", deleted);
        }
    }
}
