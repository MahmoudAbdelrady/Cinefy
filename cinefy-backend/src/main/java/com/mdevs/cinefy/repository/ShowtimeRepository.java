package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.ShowtimeStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

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

    boolean existsByHallAndStatusIn(Hall hall, Collection<ShowtimeStatus> statuses);

    boolean existsByHallAndStatusInAndIdNot(Hall hall, Collection<ShowtimeStatus> statuses, Long id);

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
    List<LocalDate> findDistinctShowtimeDatesByMovieAndStatuses(@Param("movieId") Long movieId, @Param("statuses") Collection<ShowtimeStatus> statuses);

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
                                                           @Param("statuses") Collection<ShowtimeStatus> statuses,
                                                           @Param("startDateTime") LocalDateTime startDateTime,
                                                           @Param("endDateTime") LocalDateTime endDateTime);
}
