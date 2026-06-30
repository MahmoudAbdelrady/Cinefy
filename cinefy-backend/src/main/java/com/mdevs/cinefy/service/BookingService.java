package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.booking.BookedSeatDTO;
import com.mdevs.cinefy.dto.booking.BookingDetailDTO;
import com.mdevs.cinefy.dto.booking.BookingRequestDTO;
import com.mdevs.cinefy.dto.booking.SeatSelectionDTO;
import com.mdevs.cinefy.dto.hall.HallLayout;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.BookingSeat;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.enums.BookingStatus;
import com.mdevs.cinefy.entity.enums.SeatCategory;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.repository.BookingRepository;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingService {

    private final ShowtimeRepository showtimeRepository;

    private final BookingRepository bookingRepository;

    private final HallService hallService;

    private final TmdbMovieService tmdbMovieService;

    @Lazy
    private final BookingService self;

    private static final int HOLD_WINDOW_MINUTES = 10;

    private static final String REFERENCE_PREFIX = "CINEFY-";

    private static final String REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private static final int REFERENCE_LENGTH = 8;

    private static final SecureRandom RANDOM = new SecureRandom();

    // ========================= Public API =========================

    public SeatSelectionDTO getSeatSelection(String showtimeUuid) {
        Showtime showtime = findBookableShowtime(showtimeUuid);
        Hall hall = showtime.getHall();

        HallLayoutDTO hallLayout = hallService.getHallLayout(hall);
        hallLayout.getLayout().setReserved(getReservedSeats(showtime));

        return toSeatSelectionDTO(showtime, hall, hallLayout);
    }

    public BookingDetailDTO createBooking(BookingRequestDTO dto, String idempotencyKey) {
        // TODO: throw on a key hit with a different payload (compare a stored request fingerprint) instead of blindly replaying.
        BookingDetailDTO existing = findExistingBooking(idempotencyKey);
        if (existing != null) {
            return existing;
        }

        try {
            return self.persistBooking(dto, idempotencyKey);
        } catch (DataIntegrityViolationException e) {
            log.error("Booking save conflict for idempotency key {}: {}", idempotencyKey, e.getMessage(), e);
            BookingDetailDTO recovered = findExistingBooking(idempotencyKey);
            if (recovered == null) {
                throw new BusinessException("One or more selected seats have been taken");
            }
            return recovered;
        }
    }

    @Transactional
    public BookingDetailDTO persistBooking(BookingRequestDTO dto, String idempotencyKey) {
        Showtime showtime = findBookableShowtime(dto.getShowtimeId());
        Hall hall = showtime.getHall();

        // Todo: load current logged-in user. Check if they have an active reservation for the same showtime and delete it

        Booking booking = new Booking();
        booking.setShowtime(showtime);
        booking.setHall(hall);
        booking.setHallName(hall.getName());
        booking.setHallType(hall.getType().getName());
        booking.setIdempotencyKey(idempotencyKey);
        booking.setBookingReference(generateReference());
        booking.setExpiresAt(LocalDateTime.now().plusMinutes(HOLD_WINDOW_MINUTES));

        claimRequestedSeats(showtime, dto.getSeats());
        buildSeats(booking, showtime, hall, dto.getSeats());

        bookingRepository.save(booking);

        return toBookingDetailDTO(booking);
    }

    @Transactional
    public int deleteExpiredPendingBatch(LocalDateTime cutOffDate, int batchSize) {
        List<Long> bookingIds = bookingRepository.findExpiredPendingIds(cutOffDate, PageRequest.of(0, batchSize));
        if (bookingIds.isEmpty()) {
            return 0;
        }

        bookingRepository.deleteSeatsByBookingIds(bookingIds);
        return bookingRepository.deleteBookingsByIds(bookingIds);
    }

    // =========================== Helpers ===========================

    private BookingDetailDTO findExistingBooking(String idempotencyKey) {
        return bookingRepository.findByIdempotencyKeyWithDetail(idempotencyKey)
                .map(this::toBookingDetailDTO)
                .orElse(null);
    }

    private Showtime findBookableShowtime(String uuid) {
        Showtime showtime = showtimeRepository.findByUuidWithHall(uuid)
                .orElseThrow(() -> new NotFoundException("Showtime not found: " + uuid));
        if (!ShowtimeStatus.COMMITTED_STATUSES.contains(showtime.getStatus())) {
            throw new BusinessException("This showtime is not available for booking");
        }
        return showtime;
    }

    // TODO: populate from the BookingSeat rows (active = true) for this showtime
    private List<String> getReservedSeats(Showtime showtime) {
        return List.of();
    }

    private void claimRequestedSeats(Showtime showtime, List<String> requestedPositions) {
        LocalDateTime now = LocalDateTime.now();
        List<BookingSeat> activeSeats = bookingRepository.findActiveSeats(showtime.getId(), requestedPositions);

        List<String> blockedPositions = new ArrayList<>();
        for (BookingSeat activeSeat : activeSeats) {
            Booking booking = activeSeat.getBooking();
            boolean blocking = booking.getStatus().equals(BookingStatus.CONFIRMED)
                    || (booking.getStatus().equals(BookingStatus.PENDING) && booking.getExpiresAt().isAfter(now));
            if (blocking) {
                blockedPositions.add(activeSeat.getPosition());
            } else {
                // No explicit save: flushed via Hibernate dirty checking.
                activeSeat.setActive(false);
            }
        }

        if (!blockedPositions.isEmpty()) {
            throw new BusinessException("Seat(s) already reserved: " + String.join(", ", blockedPositions));
        }
    }

    private void buildSeats(Booking booking, Showtime showtime, Hall hall, List<String> requestedPositions) {
        HallLayout layout = hall.getLayout();
        Map<SeatCategory, BigDecimal> prices = hall.getCategoryPrices();
        Set<String> seen = new LinkedHashSet<>();

        for (String position : requestedPositions) {
            if (!seen.add(position)) {
                throw new BusinessException("Duplicate seat in request: " + position);
            }
            if (!hallService.isSeatInGrid(hall, position)) {
                throw new BusinessException("Seat '" + position + "' does not exist in this hall");
            }

            SeatCategory category = resolvePositionCategory(layout, position);
            if (category.equals(SeatCategory.AISLE)) {
                throw new BusinessException("Seat '" + position + "' is an aisle and cannot be booked");
            }

            // TODO: only staff member accounts are allowed to do it
            if (layout.onSiteOnly().contains(position)) {
                throw new BusinessException("Seat '" + position + "' can only be booked on-site");
            }

            BookingSeat seat = new BookingSeat();
            seat.setBooking(booking);
            seat.setShowtime(showtime);
            seat.setPosition(position);
            seat.setCategory(category);
            seat.setTicketPrice(prices.get(category));
            booking.getSeats().add(seat);
        }
    }

    private SeatCategory resolvePositionCategory(HallLayout layout, String position) {
        return layout.categories().entrySet().stream()
                .filter(entry -> entry.getValue().contains(position))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(SeatCategory.NORMAL);
    }

    private String generateReference() {
        StringBuilder reference = new StringBuilder(REFERENCE_PREFIX);
        for (int i = 0; i < REFERENCE_LENGTH; i++) {
            reference.append(REFERENCE_ALPHABET.charAt(RANDOM.nextInt(REFERENCE_ALPHABET.length())));
        }
        return reference.toString();
    }

    private SeatSelectionDTO toSeatSelectionDTO(Showtime showtime, Hall hall, HallLayoutDTO hallLayout) {
        SeatSelectionDTO dto = new SeatSelectionDTO();
        dto.setMovieTitle(showtime.getTmdbMovie().getTitle());
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setHallName(hall.getName());
        dto.setHallType(hall.getType().getName());
        dto.set3D(showtime.is3D());
        dto.setHallLayout(hallLayout);
        return dto;
    }

    private BookingDetailDTO toBookingDetailDTO(Booking booking) {
        List<BookedSeatDTO> seats = booking.getSeats().stream()
                .map(seat -> new BookedSeatDTO(seat.getPosition(), seat.getCategory(), seat.getTicketPrice()))
                .toList();

        BookingDetailDTO dto = new BookingDetailDTO();
        dto.setId(booking.getUuid());
        dto.setBookingReference(booking.getBookingReference());
        dto.setExpiresAt(booking.getExpiresAt());
        dto.setMovie(tmdbMovieService.toSearchResult(booking.getShowtime().getTmdbMovie()));
        dto.setHallName(booking.getHallName());
        dto.setHallType(booking.getHallType());
        dto.setSeats(seats);
        return dto;
    }
}
