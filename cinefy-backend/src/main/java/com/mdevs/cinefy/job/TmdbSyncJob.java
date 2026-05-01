package com.mdevs.cinefy.job;

import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.repository.TmdbMovieRepository;
import com.mdevs.cinefy.service.TmdbMovieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

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

        int deleted = tmdbMovieService.deleteOrphans();
        log.info("TMDB sync job: deleted {} orphan movies", deleted);

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

        log.info("TMDB sync job: done (deleted={}, refreshed={}, failed={})", deleted, refreshed, failed);
    }
}
