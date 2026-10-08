package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.projection.showtime.MovieShowtimeCountProjection;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ShowtimeRepository extends BaseRepository<Showtime> {

    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
            FROM Showtime s
            WHERE s.hall = :hall
            AND s.startDateTime < :end
            AND s.endDateTime > :start
            AND (:excludeId IS NULL OR s.id != :excludeId)
            """)
    boolean existsOverlapping(@Param("hall") Hall hall, @Param("start") Instant start, @Param("end") Instant end, @Param("excludeId") Long excludeId);

    boolean existsByHall(Hall hall);

    boolean existsByHallAndStatusIn(Hall hall, Set<ShowtimeStatus> statuses);

    boolean existsByHallAndStatusInAndIdNot(Hall hall, Set<ShowtimeStatus> statuses, Long id);

    Optional<Showtime> findByUuid(String uuid);

    @Query("""
            SELECT s FROM Showtime s
            JOIN FETCH s.tmdbMovie
            JOIN FETCH s.hall h
            JOIN FETCH h.type
            WHERE s.uuid = :uuid
            """)
    Optional<Showtime> findByUuidWithHall(@Param("uuid") String uuid);

    @Query("SELECT s FROM Showtime s WHERE s.tmdbMovie.id = :movieId AND s.status = :status AND (CAST(:startDateTime AS Instant) IS NULL OR s.startDateTime >= :startDateTime) AND (CAST(:endDateTime AS Instant) IS NULL OR s.startDateTime < :endDateTime)")
    List<Showtime> findByTmdbMovieAndStatusAndStartDateTimeInRange(@Param("movieId") Long movieId,
                                                                   @Param("status") ShowtimeStatus status,
                                                                   @Param("startDateTime") Instant startDateTime,
                                                                   @Param("endDateTime") Instant endDateTime);

    @Query("""
            SELECT DISTINCT s.startDateTime
            FROM Showtime s
            WHERE s.tmdbMovie.id = :movieId
            AND s.status IN :statuses
            ORDER BY s.startDateTime ASC
            """)
    List<Instant> findStartDateTimesByMovieAndStatuses(@Param("movieId") Long movieId,
                                                       @Param("statuses") Set<ShowtimeStatus> statuses);

    @Query("""
            SELECT DISTINCT s.startDateTime
            FROM Showtime s
            WHERE s.tmdbMovie.id = :movieId
            AND s.status IN :statuses
            AND s.endDateTime > :cutOffDate
            ORDER BY s.startDateTime ASC
            """)
    List<Instant> findBookableStartDateTimes(@Param("movieId") Long movieId,
                                             @Param("statuses") Set<ShowtimeStatus> statuses,
                                             @Param("cutOffDate") Instant cutOffDate);

    long countByTmdbMovieIdAndStatusIn(Long tmdbMovieId, Set<ShowtimeStatus> statuses);

    boolean existsByTmdbMovieIdAndStatusIn(Long tmdbMovieId, Set<ShowtimeStatus> statuses);

    List<Showtime> findByTmdbMovieIdAndStatusIn(Long tmdbMovieId, Set<ShowtimeStatus> statuses);

    @Query("""
            SELECT s FROM Showtime s
            JOIN FETCH s.hall h
            JOIN FETCH h.type
            JOIN FETCH s.tmdbMovie
            WHERE (:movieId IS NULL OR s.tmdbMovie.id = :movieId)
            AND s.status IN :statuses
            AND s.startDateTime >= :startDateTime
            AND s.startDateTime < :endDateTime
            ORDER BY s.startDateTime ASC
            """)
    List<Showtime> findByMovieStatusesAndDateRangeWithHall(@Param("movieId") Long movieId,
                                                           @Param("statuses") Set<ShowtimeStatus> statuses,
                                                           @Param("startDateTime") Instant startDateTime,
                                                           @Param("endDateTime") Instant endDateTime);

    @Query("""
            SELECT s FROM Showtime s
            JOIN FETCH s.hall h
            JOIN FETCH h.type
            WHERE s.tmdbMovie.id = :movieId
            AND s.status IN :statuses
            AND s.startDateTime >= :startDateTime
            AND s.startDateTime < :endDateTime
            AND s.endDateTime > :cutOffDate
            ORDER BY s.startDateTime ASC
            """)
    List<Showtime> findBookableByMovieAndDateRangeWithHall(@Param("movieId") Long movieId,
                                                           @Param("statuses") Set<ShowtimeStatus> statuses,
                                                           @Param("startDateTime") Instant startDateTime,
                                                           @Param("endDateTime") Instant endDateTime,
                                                           @Param("cutOffDate") Instant cutOffDate);

    long countByStatusIn(Set<ShowtimeStatus> statuses);

    @Query("SELECT COUNT(DISTINCT s.tmdbMovie.id) FROM Showtime s WHERE s.status IN :statuses")
    long countDistinctMoviesByStatusIn(@Param("statuses") Set<ShowtimeStatus> statuses);

    long countByStatusInAndStartDateTimeGreaterThanEqualAndStartDateTimeLessThan(Set<ShowtimeStatus> statuses,
                                                                                 Instant startInclusive,
                                                                                 Instant endExclusive);

    @Query("""
            SELECT s.tmdbMovie.id AS movieId,
                   COUNT(s) AS totalShowtimes,
                   SUM(CASE WHEN s.status = 'DRAFT' THEN 1 ELSE 0 END) AS totalDraftShowtimes
            FROM Showtime s
            WHERE s.status IN :statuses
            GROUP BY s.tmdbMovie.id
            ORDER BY COUNT(s) DESC
            """)
    List<MovieShowtimeCountProjection> findMovieShowtimeCounts(@Param("statuses") Set<ShowtimeStatus> statuses);

    @Modifying
    @Query("""
            UPDATE Showtime s SET s.status = 'RUNNING'
            WHERE s.status = 'PUBLISHED'
            AND s.startDateTime <= :now
            AND s.endDateTime > :now
            """)
    int markRunningAsOf(@Param("now") Instant now);

    @Modifying
    @Query("""
            UPDATE Showtime s SET s.status = 'FINISHED'
            WHERE s.status IN ('PUBLISHED', 'RUNNING')
            AND s.endDateTime <= :now
            """)
    int markFinishedAsOf(@Param("now") Instant now);
}
