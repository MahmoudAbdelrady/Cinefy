package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.TmdbMovie;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TmdbMovieRepository extends JpaRepository<TmdbMovie, Long> {

    @Modifying
    @Query("DELETE FROM TmdbMovie m WHERE NOT EXISTS (SELECT 1 FROM Showtime s WHERE s.tmdbMovie = m)")
    int deleteOrphans();

    List<TmdbMovie> findByIdGreaterThanOrderByIdAsc(Long maxId, Pageable pageable);
}
