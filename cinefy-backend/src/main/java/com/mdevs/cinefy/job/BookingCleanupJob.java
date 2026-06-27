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

    private final BookingService bookingService;

    @Scheduled(cron = "0 */10 * * * *")
    public void deleteExpiredPendingBookings() {
        int deleted = bookingService.deleteExpiredPendingBookings(LocalDateTime.now());

        if (deleted > 0) {
            log.info("Booking cleanup: deleted {} expired pending bookings", deleted);
        }
    }
}
