package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.booking.BookingDetailDTO;
import com.mdevs.cinefy.dto.booking.BookingRequestDTO;
import com.mdevs.cinefy.dto.booking.SeatSelectionDTO;
import com.mdevs.cinefy.dto.showtime.HallTypeShowtimesDTO;
import com.mdevs.cinefy.service.BookingService;
import com.mdevs.cinefy.service.ShowtimeService;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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

    private final BookingService bookingService;

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

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/showtimes/{uuid}")
    public ResponseEntity<SeatSelectionDTO> getSeatSelection(@PathVariable String uuid) {
        return ResponseEntity.ok(bookingService.getSeatSelection(uuid));
    }

    @PostMapping
    public ResponseEntity<BookingDetailDTO> createBooking(@Valid @RequestBody BookingRequestDTO dto,
                                                          @RequestHeader("Idempotency-Key") String idempotencyKey) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(dto, idempotencyKey));
    }
}
