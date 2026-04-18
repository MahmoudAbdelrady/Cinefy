package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.TmdbMovie;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TmdbMovieRepository extends JpaRepository<TmdbMovie, Long> {
}
