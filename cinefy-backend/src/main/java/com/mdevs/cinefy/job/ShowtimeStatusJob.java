package com.mdevs.cinefy.job;

import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.repository.HallRepository;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShowtimeStatusJob {

    private final ShowtimeRepository showtimeRepository;

    private final HallRepository hallRepository;

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void tickShowtimeStatuses() {
        LocalDateTime now = LocalDateTime.now();
        int running = showtimeRepository.markRunningAsOf(now);
        int finished = showtimeRepository.markFinishedAsOf(now);
        // @TODO --> query for deleting finished or cancelled showtimes from a long time
        int hallsReleased = finished > 0 ? hallRepository.flipIdleScheduledHallsToActive(ShowtimeStatus.LIVE_STATUSES) : 0;
        if (running > 0 || finished > 0) {
            log.info("Showtime status tick: running={}, finished={}, hallsReleased={}", running, finished, hallsReleased);
        }
    }
}
