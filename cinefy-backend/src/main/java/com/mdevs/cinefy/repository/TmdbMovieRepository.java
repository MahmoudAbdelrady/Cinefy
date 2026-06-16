package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.dto.movie.MovieWithCommittedShowtimeProjection;
import com.mdevs.cinefy.dto.movie.NowShowingProjection;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public interface TmdbMovieRepository extends JpaRepository<TmdbMovie, Long> {

    @Modifying
    @Query("""
            DELETE FROM TmdbMovie m
            WHERE NOT EXISTS (SELECT 1 FROM Showtime s WHERE s.tmdbMovie = m)
            AND (m.isAnnounced = false OR m.releaseDate <= :today)
            """)
    int deleteOrphans(@Param("today") LocalDate today);

    @Query("SELECT m FROM TmdbMovie m WHERE m.isAnnounced = true AND m.releaseDate > :today ORDER BY m.releaseDate ASC")
    List<TmdbMovie> findAnnouncedUpcoming(@Param("today") LocalDate today);

    @Query("""
            SELECT m AS movie, (COUNT(s.id) > 0) AS hasCommittedShowtime
            FROM TmdbMovie m
            LEFT JOIN Showtime s ON s.tmdbMovie = m AND s.status IN :statuses
            WHERE m.isHighlighted = true
            AND (
                (m.isAnnounced = true AND m.releaseDate > :today)
                OR s.id IS NOT NULL
            )
            GROUP BY m
            ORDER BY m.releaseDate DESC
            """)
    List<MovieWithCommittedShowtimeProjection> findHighlightedWithBookingFlag(@Param("today") LocalDate today, @Param("statuses") Set<ShowtimeStatus> statuses);

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

    List<TmdbMovie> findByIdGreaterThanOrderByIdAsc(Long maxId, Pageable pageable);
}
