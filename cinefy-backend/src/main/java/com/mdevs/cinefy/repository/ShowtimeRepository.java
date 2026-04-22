package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.dto.showtime.MovieShowtimeCountProjection;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.ShowtimeStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ShowtimeRepository extends BaseRepository<Showtime> {

    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
            FROM Showtime s
            WHERE s.hall = :hall
            AND s.status != 'CANCELLED'
            AND s.startDateTime < :end
            AND s.endDateTime > :start
            AND (:excludeId IS NULL OR s.id != :excludeId)
            """)
    boolean existsOverlapping(@Param("hall") Hall hall, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("excludeId") Long excludeId);

    boolean existsByHallAndStatusIn(Hall hall, Set<ShowtimeStatus> statuses);

    boolean existsByHallAndStatusInAndIdNot(Hall hall, Set<ShowtimeStatus> statuses, Long id);

    Optional<Showtime> findByUuid(String uuid);

    @Query("SELECT s FROM Showtime s WHERE s.tmdbMovie.id = :movieId AND s.status = :status AND (:startDateTime IS NULL OR s.startDateTime >= :startDateTime) AND (:endDateTime IS NULL OR s.startDateTime < :endDateTime)")
    List<Showtime> findByTmdbMovieAndStatusAndStartDateTimeInRange(@Param("movieId") Long movieId,
                                                                   @Param("status") ShowtimeStatus status,
                                                                   @Param("startDateTime") LocalDateTime startDateTime,
                                                                   @Param("endDateTime") LocalDateTime endDateTime);

    @Query("""
            SELECT DISTINCT CAST(s.startDateTime AS LocalDate)
            FROM Showtime s
            WHERE s.tmdbMovie.id = :movieId
            AND s.status IN :statuses
            ORDER BY CAST(s.startDateTime AS LocalDate) ASC
            """)
    List<LocalDate> findDistinctShowtimeDatesByMovieAndStatuses(@Param("movieId") Long movieId, @Param("statuses") Set<ShowtimeStatus> statuses);

    long countByTmdbMovieIdAndStatus(Long tmdbMovieId, ShowtimeStatus status);

    @Query("""
            SELECT s FROM Showtime s
            JOIN FETCH s.hall
            WHERE s.tmdbMovie.id = :movieId
            AND s.status IN :statuses
            AND s.startDateTime >= :startDateTime
            AND s.startDateTime < :endDateTime
            ORDER BY s.startDateTime ASC
            """)
    List<Showtime> findByMovieStatusesAndDateRangeWithHall(@Param("movieId") Long movieId,
                                                           @Param("statuses") Set<ShowtimeStatus> statuses,
                                                           @Param("startDateTime") LocalDateTime startDateTime,
                                                           @Param("endDateTime") LocalDateTime endDateTime);

    long countByStatusIn(Set<ShowtimeStatus> statuses);

    @Query("SELECT COUNT(DISTINCT s.tmdbMovie.id) FROM Showtime s WHERE s.status IN :statuses")
    long countDistinctMoviesByStatusIn(@Param("statuses") Set<ShowtimeStatus> statuses);

    long countByStatusInAndStartDateTimeGreaterThanEqualAndStartDateTimeLessThan(Set<ShowtimeStatus> statuses,
                                                                                 LocalDateTime startInclusive,
                                                                                 LocalDateTime endExclusive);

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
}
