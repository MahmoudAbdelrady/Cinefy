package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.showtime.MovieShowtimeDatesDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.MovieWithShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.PublishShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimeDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimeSummaryDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimesStatisticsDTO;
import com.mdevs.cinefy.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping("/movie-dates")
    public ResponseEntity<MovieShowtimeDatesDTO> getMovieShowtimeDates(@RequestParam Long movieId) {
        return ResponseEntity.ok(showtimeService.getMovieShowtimeDates(movieId));
    }

    @GetMapping("/movie-day")
    public ResponseEntity<MovieShowtimesDTO> getMovieShowtimesForDate(@RequestParam Long movieId, @RequestParam LocalDate date) {
        return ResponseEntity.ok(showtimeService.getMovieShowtimesForDate(movieId, date));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ShowtimesStatisticsDTO> getShowtimesStatistics() {
        return ResponseEntity.ok(showtimeService.getShowtimesStatistics());
    }

    @GetMapping("/movies")
    public ResponseEntity<List<MovieWithShowtimesDTO>> getMovies() {
        return ResponseEntity.ok(showtimeService.getMoviesWithShowtimes());
    }

    @PostMapping
    public ResponseEntity<ShowtimeSummaryDTO> createShowtime(@Valid @RequestBody ShowtimeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(showtimeService.createShowtime(dto));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<ShowtimeSummaryDTO> updateShowtime(@PathVariable String uuid, @Valid @RequestBody ShowtimeDTO dto) {
        return ResponseEntity.ok(showtimeService.updateShowtime(uuid, dto));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteShowtime(@PathVariable String uuid) {
        showtimeService.deleteShowtime(uuid);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/publish")
    public ResponseEntity<Void> publishShowtimes(@RequestBody PublishShowtimesDTO dto) {
        showtimeService.publishShowtimes(dto);
        return ResponseEntity.noContent().build();
    }
}
