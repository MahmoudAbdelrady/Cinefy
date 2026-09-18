package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.movie.AnnouncementRequestDTO;
import com.mdevs.cinefy.dto.movie.HighlightRequestDTO;
import com.mdevs.cinefy.dto.movie.HighlightedMovieDTO;
import com.mdevs.cinefy.dto.movie.MovieDetailDTO;
import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;
import com.mdevs.cinefy.dto.movie.NowShowingMovieDTO;
import com.mdevs.cinefy.dto.movie.UpcomingMovieDTO;
import com.mdevs.cinefy.service.TmdbMovieService;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
public class TmdbMovieController {

    private final TmdbMovieService tmdbMovieService;

    @GetMapping("/search")
    public ResponseEntity<Page<MovieSearchResultDTO>> searchMovies(@RequestParam String query, Pageable pageable) {
        return ResponseEntity.ok(tmdbMovieService.searchMovies(query, pageable));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<UpcomingMovieDTO>> getUpcomingMovies(@RequestParam(required = false, defaultValue = "20") int limit) {
        return ResponseEntity.ok(tmdbMovieService.getUpcomingMovies(limit));
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/announced-upcoming")
    public ResponseEntity<List<MovieSearchResultDTO>> getAnnouncedUpcoming() {
        return ResponseEntity.ok(tmdbMovieService.getAnnouncedUpcoming());
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/highlighted")
    public ResponseEntity<List<HighlightedMovieDTO>> getHighlighted() {
        return ResponseEntity.ok(tmdbMovieService.getHighlighted());
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/now-showing")
    public ResponseEntity<List<NowShowingMovieDTO>> getNowShowing(@RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(tmdbMovieService.getNowShowing(limit));
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/{id}")
    public ResponseEntity<MovieDetailDTO> getMovieDetails(@PathVariable long id) {
        return ResponseEntity.ok(tmdbMovieService.getMovieDetails(id));
    }

    @PostMapping("/{id}/announcement")
    public ResponseEntity<Void> setAnnouncement(@PathVariable long id, @Valid @RequestBody AnnouncementRequestDTO dto) {
        tmdbMovieService.setAnnouncement(id, dto.getAnnounced());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/highlight")
    public ResponseEntity<Void> setHighlight(@PathVariable long id, @Valid @RequestBody HighlightRequestDTO dto) {
        tmdbMovieService.setHighlight(id, dto.getHighlighted());
        return ResponseEntity.noContent().build();
    }
}
