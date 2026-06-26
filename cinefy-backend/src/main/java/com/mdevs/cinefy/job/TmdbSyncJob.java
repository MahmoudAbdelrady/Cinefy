package com.mdevs.cinefy.job;

import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.repository.TmdbMovieRepository;
import com.mdevs.cinefy.service.TmdbMovieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TmdbSyncJob {

    private final TmdbMovieRepository tmdbMovieRepository;

    private final TmdbMovieService tmdbMovieService;

    private static final int BATCH_SIZE = 50;

    @Scheduled(cron = "0 0 3 * * *")
    public void syncTmdbMovies() {
        log.info("TMDB sync job: starting");

        int demoted = tmdbMovieService.demoteIneligibleHighlighted();
        log.info("TMDB sync job: demoted {} stale highlighted movies", demoted);

        int deleted = deleteOrphanMovies();
        log.info("TMDB sync job: deleted {} orphan movies", deleted);

        RefreshResult refresh = refreshMovies();

        log.info("TMDB sync job: done (demoted={}, deleted={}, refreshed={}, failed={})", demoted, deleted, refresh.refreshed(), refresh.failed());
    }

    private int deleteOrphanMovies() {
        LocalDate today = LocalDate.now();
        int deleted = 0;
        int deletedBatch;
        do {
            deletedBatch = tmdbMovieService.deleteOrphanBatch(today, BATCH_SIZE);
            deleted += deletedBatch;
        } while (deletedBatch == BATCH_SIZE);
        return deleted;
    }

    private RefreshResult refreshMovies() {
        long maxId = 0L;
        int refreshed = 0;
        int failed = 0;

        while (true) {
            List<TmdbMovie> batch = tmdbMovieRepository.findByIdGreaterThanOrderByIdAsc(maxId, PageRequest.ofSize(BATCH_SIZE));
            if (batch.isEmpty()) break;

            for (TmdbMovie movie : batch) {
                try {
                    tmdbMovieService.refreshOrDelete(movie);
                    refreshed++;
                } catch (Exception e) {
                    log.error("TMDB sync: failed for movie id={}", movie.getId(), e);
                    failed++;
                }
            }

            maxId = batch.getLast().getId();
        }

        return new RefreshResult(refreshed, failed);
    }

    private record RefreshResult(int refreshed, int failed) {
    }
}
