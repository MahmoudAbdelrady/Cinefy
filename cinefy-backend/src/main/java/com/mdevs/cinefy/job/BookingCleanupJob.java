package com.mdevs.cinefy.job;

import com.mdevs.cinefy.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingCleanupJob {

    private static final int BATCH_SIZE = 200;

    private final BookingService bookingService;

    @Scheduled(cron = "0 * * * * *")
    public void deleteExpiredPendingBookings() {
        LocalDateTime cutOffDate = LocalDateTime.now();

        int totalDeleted = 0;
        int batchDeleted;
        do {
            batchDeleted = bookingService.deleteExpiredPendingBatch(cutOffDate, BATCH_SIZE);
            totalDeleted += batchDeleted;
        } while (batchDeleted == BATCH_SIZE);

        if (totalDeleted > 0) {
            log.info("Booking cleanup: deleted {} expired pending bookings", totalDeleted);
        }
    }
}
