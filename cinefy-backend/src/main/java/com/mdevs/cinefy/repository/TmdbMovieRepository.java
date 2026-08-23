package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.dto.movie.MovieWithCommittedShowtimeProjection;
import com.mdevs.cinefy.dto.movie.NowShowingProjection;
import com.mdevs.cinefy.dto.statistics.MovieRevenueProjection;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface TmdbMovieRepository extends JpaRepository<TmdbMovie, Long> {

    @Modifying
    @Query(
            value = """
                    DELETE FROM TMDB_MOVIES WHERE ID IN (
                        SELECT ID FROM TMDB_MOVIES m
                        WHERE NOT EXISTS (SELECT 1 FROM SHOWTIMES s WHERE s.TMDB_MOVIE_ID = m.ID)
                        AND (m.IS_ANNOUNCED = false OR m.RELEASE_DATE <= :cutoffDate)
                        ORDER BY m.ID
                        LIMIT :batchSize
                    )
                    """,
            nativeQuery = true
    )
    int deleteOrphansBatch(@Param("cutoffDate") LocalDate cutoffDate, @Param("batchSize") int batchSize);

    @Modifying
    @Query("""
            UPDATE TmdbMovie m SET m.isHighlighted = false
            WHERE m.isHighlighted = true
            AND NOT EXISTS (
                SELECT 1 FROM Showtime s
                WHERE s.tmdbMovie = m AND s.status IN :committedStatuses
            )
            AND (m.isAnnounced = false OR m.releaseDate <= :cutoffDate)
            """)
    int demoteIneligibleHighlighted(@Param("cutoffDate") LocalDate cutoffDate,
                                    @Param("committedStatuses") Set<ShowtimeStatus> committedStatuses);

    @Query("SELECT m FROM TmdbMovie m WHERE m.isAnnounced = true AND m.releaseDate > :cutoffDate ORDER BY m.releaseDate ASC")
    List<TmdbMovie> findAnnouncedUpcoming(@Param("cutoffDate") LocalDate cutoffDate);

    @Query("""
            SELECT m AS movie, (COUNT(s.id) > 0) AS hasCommittedShowtime
            FROM TmdbMovie m
            LEFT JOIN Showtime s ON s.tmdbMovie = m AND s.status IN :statuses
            WHERE m.isHighlighted = true
            AND (
                (m.isAnnounced = true AND m.releaseDate > :cutoffDate)
                OR s.id IS NOT NULL
            )
            GROUP BY m
            ORDER BY m.releaseDate DESC
            """)
    List<MovieWithCommittedShowtimeProjection> findHighlightedWithBookingFlag(@Param("cutoffDate") LocalDate cutoffDate, @Param("statuses") Set<ShowtimeStatus> statuses);

    @Query("""
            SELECT m AS movie, (MAX(CASE WHEN s.is3D = true THEN 1 ELSE 0 END) > 0) AS is3D, STRING_AGG(ht.name, ',') AS hallTypes
            FROM TmdbMovie m
            JOIN Showtime s ON s.tmdbMovie = m
            JOIN s.hall.type ht
            WHERE s.status IN :statuses
            GROUP BY m.id
            ORDER BY m.releaseDate DESC
            """)
    List<NowShowingProjection> findNowShowing(@Param("statuses") Set<ShowtimeStatus> statuses, Pageable pageable);

    long countByIsHighlightedTrue();

    @Query("""
            SELECT m AS movie, (COUNT(s.id) > 0) AS hasCommittedShowtime
            FROM TmdbMovie m
            LEFT JOIN Showtime s ON s.tmdbMovie = m AND s.status IN :statuses
            WHERE m.id IN :ids
            GROUP BY m
            """)
    List<MovieWithCommittedShowtimeProjection> findMoviesWithCommittedShowtime(@Param("ids") List<Long> ids, @Param("statuses") Set<ShowtimeStatus> statuses);

    @Query(value = """
            SELECT new com.mdevs.cinefy.dto.statistics.MovieRevenueProjection(
                m.id,
                m.title,
                COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.totalAmount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN b.status = 'REFUNDED' THEN b.totalAmount ELSE 0 END), 0),
                COUNT(DISTINCT s.id))
            FROM TmdbMovie m
            JOIN Showtime s ON s.tmdbMovie = m
            LEFT JOIN Booking b ON b.showtime = s
            WHERE s.startDateTime BETWEEN :from AND :to
            GROUP BY m.id
            ORDER BY COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.totalAmount ELSE 0 END), 0) DESC
            """,
            countQuery = """
                    SELECT COUNT(DISTINCT m.id)
                    FROM TmdbMovie m
                    JOIN Showtime s ON s.tmdbMovie = m
                    WHERE s.startDateTime BETWEEN :from AND :to
                    """)
    Page<MovieRevenueProjection> findMoviePerformanceBetween(@Param("from") LocalDateTime from,
                                                             @Param("to") LocalDateTime to,
                                                             Pageable pageable);

    List<TmdbMovie> findByIdGreaterThanOrderByIdAsc(Long maxId, Pageable pageable);
}
