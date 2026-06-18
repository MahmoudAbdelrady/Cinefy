package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.showtime.HallTypeShowtimesDTO;
import com.mdevs.cinefy.service.ShowtimeService;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/booking")
@RequiredArgsConstructor
public class BookingController {

    private final ShowtimeService showtimeService;

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/movies/{id}/dates")
    public ResponseEntity<List<String>> getBookableDates(@PathVariable long id) {
        return ResponseEntity.ok(showtimeService.getBookableDates(id));
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/movies/{id}/showtimes")
    public ResponseEntity<List<HallTypeShowtimesDTO>> getBookableShowtimes(@PathVariable long id, @RequestParam LocalDate date) {
        return ResponseEntity.ok(showtimeService.getBookableShowtimesForDate(id, date));
    }
}
