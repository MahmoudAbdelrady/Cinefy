package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.booking.BookingConfirmationDTO;
import com.mdevs.cinefy.dto.booking.BookingDetailDTO;
import com.mdevs.cinefy.dto.booking.BookingRequestDTO;
import com.mdevs.cinefy.dto.booking.BookingSummaryDTO;
import com.mdevs.cinefy.dto.booking.SeatSelectionDTO;
import com.mdevs.cinefy.dto.payment.CardTokenCallbackDTO;
import com.mdevs.cinefy.dto.payment.PaymentCallbackData;
import com.mdevs.cinefy.dto.payment.PaymentRedirectionDTO;
import com.mdevs.cinefy.dto.payment.SavedCardPaymentDTO;
import com.mdevs.cinefy.dto.payment.TransactionCallbackDTO;
import com.mdevs.cinefy.dto.showtime.HallTypeShowtimesDTO;
import com.mdevs.cinefy.service.BookingService;
import com.mdevs.cinefy.service.ClientPaymentMethodService;
import com.mdevs.cinefy.service.PaymentService;
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
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/booking")
@RequiredArgsConstructor
@Validated
public class BookingController {

    private final BookingService bookingService;

    private final PaymentService paymentService;

    private final ClientPaymentMethodService clientPaymentMethodService;

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
    @GetMapping("/{uuid}/confirmation")
    public ResponseEntity<BookingConfirmationDTO> getBookingConfirmation(@PathVariable String uuid) {
        return ResponseEntity.ok(bookingService.getBookingConfirmation(uuid));
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

    @PreAuthorize("hasRole('CLIENT')")
    @PostMapping("/{uuid}/pay")
    public ResponseEntity<PaymentRedirectionDTO> payBooking(@PathVariable String uuid) {
        return ResponseEntity.ok(bookingService.createPaymentCheckout(uuid));
    }

    @PreAuthorize("hasRole('CLIENT')")
    @PostMapping("/{uuid}/pay-saved-card")
    public ResponseEntity<PaymentRedirectionDTO> paySavedCard(@PathVariable String uuid,
                                                              @Valid @RequestBody SavedCardPaymentDTO dto) {
        return ResponseEntity.ok(bookingService.paySavedCard(uuid, dto));
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @GetMapping("/payment-redirect")
    public ResponseEntity<Void> handlePaymentRedirect(@RequestParam Map<String, String> params) {
        TransactionCallbackDTO transaction = params.isEmpty() ? null : paymentService.handleRedirect(params);
        String redirectUrl = bookingService.resolvePaymentRedirectUrl(transaction);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    @PublicApi
    @PreAuthorize("permitAll()")
    @PostMapping("/payment-callback")
    public ResponseEntity<Void> handlePaymentCallback(@RequestBody JsonNode payload, @RequestParam String hmac) {
        PaymentCallbackData callback = paymentService.handleCallback(payload, hmac);

        switch (callback) {
            case TransactionCallbackDTO transaction -> bookingService.applyPaymentResult(transaction);
            case CardTokenCallbackDTO token -> clientPaymentMethodService.createMethod(token);
        }

        return ResponseEntity.ok().build();
    }
}
