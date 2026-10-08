package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.projection.hall.HallStatusCountProjection;
import com.mdevs.cinefy.projection.statistics.MovieHallProjection;
import com.mdevs.cinefy.projection.statistics.HallPeriodProjection;
import com.mdevs.cinefy.projection.statistics.ShowtimeHallProjection;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.enums.HallStatus;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.entity.HallType;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface HallRepository extends BaseRepository<Hall> {

    Optional<Hall> findByUuid(String uuid);

    @Query("SELECT h FROM Hall h JOIN FETCH h.type WHERE h.uuid = :uuid")
    Optional<Hall> findByUuidWithType(@Param("uuid") String uuid);

    @Query("SELECT h FROM Hall h JOIN FETCH h.type " +
            "WHERE (:excludeHallId IS NULL OR h.uuid != :excludeHallId) " +
            "AND (:statuses IS NULL OR h.status IN :statuses) ORDER BY h.createdAt")
    List<Hall> findAllFiltered(@Param("excludeHallId") String excludeHallId, @Param("statuses") List<HallStatus> statuses);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.hall.HallStatusCountProjection(
                h.status,
                COUNT(h))
            FROM Hall h
            GROUP BY h.status
            """)
    List<HallStatusCountProjection> countByStatus();

    @Modifying
    @Query("""
            UPDATE Hall h SET h.status = 'ACTIVE'
            WHERE h.status = 'SCHEDULED'
            AND NOT EXISTS (
                SELECT 1 FROM Showtime s
                WHERE s.hall = h
                AND s.status IN :showtimeStatuses
            )
            """)
    int flipIdleScheduledHallsToActive(@Param("showtimeStatuses") Set<ShowtimeStatus> showtimeStatuses);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.statistics.HallPeriodProjection(
                h,
                s.startDateTime >= :from,
                s.startDateTime < :from)
            FROM Hall h
            JOIN Showtime s ON s.hall = h
            WHERE s.status IN :statuses
            AND s.startDateTime BETWEEN :previousFrom AND :to
            """)
    List<HallPeriodProjection> findShowtimeHallsBetween(@Param("statuses") Set<ShowtimeStatus> statuses,
                                                        @Param("previousFrom") Instant previousFrom,
                                                        @Param("from") Instant from,
                                                        @Param("to") Instant to);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.statistics.ShowtimeHallProjection(
                s.startDateTime,
                h)
            FROM Hall h
            JOIN Showtime s ON s.hall = h
            WHERE s.status IN :statuses
            AND s.startDateTime BETWEEN :from AND :to
            """)
    List<ShowtimeHallProjection> findHallPerShowtimeBetween(@Param("statuses") Set<ShowtimeStatus> statuses,
                                                            @Param("from") Instant from,
                                                            @Param("to") Instant to);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.statistics.MovieHallProjection(
                s.tmdbMovie.id,
                h)
            FROM Hall h
            JOIN Showtime s ON s.hall = h
            WHERE s.status IN :statuses
            AND s.tmdbMovie.id IN :movieIds
            AND s.startDateTime BETWEEN :from AND :to
            """)
    List<MovieHallProjection> findMovieShowtimeHallsBetween(@Param("statuses") Set<ShowtimeStatus> statuses,
                                                            @Param("movieIds") List<Long> movieIds,
                                                            @Param("from") Instant from,
                                                            @Param("to") Instant to);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByType(HallType hallType);
}
