package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.booking.BookingDetailDTO;
import com.mdevs.cinefy.dto.booking.BookingRequestDTO;
import com.mdevs.cinefy.dto.booking.BookingSummaryDTO;
import com.mdevs.cinefy.dto.booking.SeatSelectionDTO;
import com.mdevs.cinefy.dto.showtime.HallTypeShowtimesDTO;
import com.mdevs.cinefy.service.BookingService;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import com.mdevs.cinefy.shared.validation.ValidationPatterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@Validated
public class BookingController {

    private final BookingService bookingService;

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/movies/{id}/dates")
    public ResponseEntity<List<String>> getBookableDates(@PathVariable long id) {
        return ResponseEntity.ok(bookingService.getBookableDates(id));
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/movies/{id}/showtimes")
    public ResponseEntity<List<HallTypeShowtimesDTO>> getBookableShowtimes(@PathVariable long id, @RequestParam LocalDate date) {
        return ResponseEntity.ok(bookingService.getBookableShowtimesForDate(id, date));
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/showtimes/{uuid}")
    public ResponseEntity<SeatSelectionDTO> getSeatSelection(@PathVariable String uuid) {
        return ResponseEntity.ok(bookingService.getSeatSelection(uuid));
    }

    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN', 'MANAGER', 'CASHIER')")
    @GetMapping("/active")
    public ResponseEntity<List<BookingSummaryDTO>> getActiveBookings() {
        return ResponseEntity.ok(bookingService.getActiveBookings());
    }

    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN', 'MANAGER', 'CASHIER')")
    @GetMapping("/active/{uuid}")
    public ResponseEntity<BookingDetailDTO> getActiveBookingDetails(@PathVariable String uuid) {
        return ResponseEntity.ok(bookingService.getActiveBookingDetails(uuid));
    }

    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN', 'MANAGER', 'CASHIER')")
    @PostMapping
    public ResponseEntity<BookingDetailDTO> createBooking(@Valid @RequestBody BookingRequestDTO dto,
                                                          @RequestHeader("Idempotency-Key")
                                                          @Pattern(regexp = ValidationPatterns.UUID, message = "Idempotency-Key header must be a valid UUID")
                                                          String idempotencyKey) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(dto, idempotencyKey));
    }

    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN', 'MANAGER', 'CASHIER')")
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> cancelBooking(@PathVariable String uuid) {
        bookingService.cancelBooking(uuid);
        return ResponseEntity.noContent().build();
    }
}
