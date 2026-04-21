package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.MovieDetailDTO;
import com.mdevs.cinefy.dto.MovieSearchResultDTO;
import com.mdevs.cinefy.service.TmdbMovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class TmdbMovieController {

    private final TmdbMovieService tmdbMovieService;

    @GetMapping("/search")
    public ResponseEntity<Page<MovieSearchResultDTO>> searchMovies(@RequestParam String query, Pageable pageable) {
        return ResponseEntity.ok(tmdbMovieService.searchMovies(query, pageable));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<MovieSearchResultDTO>> getUpcomingMovies(@RequestParam(required = false, defaultValue = "20") int limit) {
        return ResponseEntity.ok(tmdbMovieService.getUpcomingMovies(limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieDetailDTO> getMovieDetails(@PathVariable long id) {
        return ResponseEntity.ok(tmdbMovieService.getMovieDetails(id));
    }
}
