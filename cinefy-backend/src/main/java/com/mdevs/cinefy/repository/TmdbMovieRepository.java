package com.mdevs.cinefy.repository;

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
            SELECT m FROM TmdbMovie m
            WHERE m.isHighlighted = true
            AND (
                (m.isAnnounced = true AND m.releaseDate > :today)
                OR EXISTS (SELECT 1 FROM Showtime s WHERE s.tmdbMovie = m AND s.status IN :statuses)
            )
            ORDER BY m.releaseDate DESC
            """)
    List<TmdbMovie> findHighlighted(@Param("today") LocalDate today, @Param("statuses") Set<ShowtimeStatus> statuses);

    @Query("""
            SELECT m AS movie, (MAX(CASE WHEN s.is3D = true THEN 1 ELSE 0 END) > 0) AS is3D
            FROM TmdbMovie m
            JOIN Showtime s ON s.tmdbMovie = m
            WHERE s.status IN :statuses
            GROUP BY m.id
            ORDER BY m.releaseDate DESC
            """)
    List<NowShowingProjection> findNowShowingWith3DFlag(@Param("statuses") Set<ShowtimeStatus> statuses, Pageable pageable);

    long countByIsHighlightedTrue();

    @Query("""
            SELECT m.id FROM TmdbMovie m
            WHERE EXISTS (SELECT 1 FROM Showtime s WHERE s.tmdbMovie = m AND s.status IN :statuses)
            AND m.id IN :ids
            """)
    Set<Long> findMovieIdsWithShowtimeStatusIn(@Param("ids") List<Long> ids, @Param("statuses") Set<ShowtimeStatus> statuses);

    List<TmdbMovie> findByIdGreaterThanOrderByIdAsc(Long maxId, Pageable pageable);
}
