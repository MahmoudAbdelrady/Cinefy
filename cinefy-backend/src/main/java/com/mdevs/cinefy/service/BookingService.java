package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.booking.BookedSeatDTO;
import com.mdevs.cinefy.dto.booking.BookingDetailDTO;
import com.mdevs.cinefy.dto.booking.BookingRequestDTO;
import com.mdevs.cinefy.dto.booking.SeatSelectionDTO;
import com.mdevs.cinefy.dto.hall.HallLayout;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.BookingSeat;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.User;
import com.mdevs.cinefy.entity.enums.BookingStatus;
import com.mdevs.cinefy.entity.enums.SeatCategory;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.BookingRepository;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingService {

    private final ShowtimeRepository showtimeRepository;

    private final BookingRepository bookingRepository;

    private final HallService hallService;

    private final TmdbMovieService tmdbMovieService;

    private final ClientService clientService;

    private final StaffMemberService staffMemberService;

    @Lazy
    private final BookingService self;

    private static final int HOLD_WINDOW_MINUTES = 10;

    private static final String REFERENCE_PREFIX = "CINEFY-";

    private static final String REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private static final int REFERENCE_LENGTH = 10;

    private static final SecureRandom RANDOM = new SecureRandom();

    // ========================= Public API =========================

    public SeatSelectionDTO getSeatSelection(String showtimeUuid) {
        Showtime showtime = findBookableShowtime(showtimeUuid);
        Hall hall = showtime.getHall();

        HallLayoutDTO hallLayout = hallService.getHallLayout(hall);
        List<String> reservedSeats = bookingRepository.findReservedPositions(showtime.getId(), LocalDateTime.now());
        hallLayout.getLayout().setReserved(reservedSeats);

        return toSeatSelectionDTO(showtime, hall, hallLayout);
    }

    public BookingDetailDTO createBooking(BookingRequestDTO dto, String idempotencyKey) {
        Booking existing = bookingRepository.findByIdempotencyKeyWithDetail(idempotencyKey).orElse(null);
        boolean hasExpiredPending = existing != null
                && Boolean.TRUE.equals(existing.getOnHold())
                && !existing.getExpiresAt().isAfter(LocalDateTime.now());
        if (existing != null && !hasExpiredPending) {
            return toBookingDetailDTO(existing);
        }

        try {
            return self.persistBooking(dto, idempotencyKey, existing);
        } catch (DataIntegrityViolationException e) {
            log.warn("Booking save conflict for idempotency key {}: {}", idempotencyKey, e.getMessage(), e);
            BookingDetailDTO recovered = findExistingBooking(idempotencyKey);
            if (recovered == null) {
                throw new BusinessException("One or more selected seats have been taken");
            }
            return recovered;
        }
    }

    @Transactional
    public BookingDetailDTO persistBooking(BookingRequestDTO dto, String idempotencyKey, Booking expiredBooking) {
        Showtime showtime = findBookableShowtime(dto.getShowtimeId());
        Hall hall = showtime.getHall();

        User user = loadBookingUser(SecurityUtil.getCurrentUser());
        validateSeats(hall, dto.getSeats(), user);

        if (expiredBooking != null) {
            deleteBooking(expiredBooking);
        }

        if (user instanceof Client client) {
            Booking mutated = mutateActivePendingBooking(client, showtime, hall, dto.getSeats(), idempotencyKey);
            if (mutated != null) {
                return toBookingDetailDTO(mutated);
            }
        }

        Booking booking = new Booking();
        booking.setShowtime(showtime);
        booking.setHall(hall);
        booking.setHallName(hall.getName());
        booking.setHallType(hall.getType().getName());
        booking.setIdempotencyKey(idempotencyKey);
        booking.setBookingReference(generateReference());
        booking.setExpiresAt(LocalDateTime.now().plusMinutes(HOLD_WINDOW_MINUTES));

        if (user instanceof Client client) {
            booking.setClient(client);
        } else if (user instanceof StaffMember staffMember) {
            booking.setBookedBy(staffMember);
        }

        claimRequestedSeats(showtime, dto.getSeats());
        for (String position : dto.getSeats()) {
            booking.getSeats().add(buildSeat(booking, showtime, hall, position));
        }

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

    private User loadBookingUser(UserPrincipal currentUser) {
        return currentUser.getType().equals(UserType.CLIENT)
                ? clientService.findClientByUuid(currentUser.getUuid())
                : staffMemberService.findStaffMember(currentUser.getUuid());
    }

    private void validateSeats(Hall hall, List<String> requestedPositions, User user) {
        HallLayout layout = hall.getLayout();
        Set<String> seen = new LinkedHashSet<>();
        for (String position : requestedPositions) {
            if (!seen.add(position)) {
                throw new BusinessException("Duplicate seat in request: " + position);
            }
            if (!hallService.isSeatInGrid(hall, position)) {
                throw new BusinessException("Seat '" + position + "' does not exist in this hall");
            }
            if (resolvePositionCategory(layout, position).equals(SeatCategory.AISLE)) {
                throw new BusinessException("Seat '" + position + "' is an aisle and cannot be booked");
            }
            if (user instanceof Client && layout.onSiteOnly().contains(position)) {
                throw new BusinessException("Seat '" + position + "' can only be booked on-site");
            }
        }
    }

    private void deleteBooking(Booking booking) {
        bookingRepository.delete(booking);
        bookingRepository.flush();
    }

    private Booking mutateActivePendingBooking(Client client, Showtime showtime, Hall hall,
                                               List<String> requestedPositions, String idempotencyKey) {
        Booking existing = bookingRepository
                .findActivePendingByClientAndShowtime(LocalDateTime.now(), client.getId(), showtime.getId())
                .orElse(null);
        if (existing == null) {
            return null;
        }

        Set<String> currentPositions = existing.getSeats().stream()
                .map(BookingSeat::getPosition)
                .collect(Collectors.toSet());
        Set<String> requested = new LinkedHashSet<>(requestedPositions);

        boolean overlaps = requested.stream().anyMatch(currentPositions::contains);
        if (!overlaps) {
            deleteBooking(existing);
            return null;
        }

        existing.getSeats().removeIf(seat -> !requested.contains(seat.getPosition()));

        List<String> addedPositions = requested.stream()
                .filter(position -> !currentPositions.contains(position))
                .toList();
        if (!addedPositions.isEmpty()) {
            claimRequestedSeats(showtime, addedPositions);
            for (String position : addedPositions) {
                existing.getSeats().add(buildSeat(existing, showtime, hall, position));
            }
        }
        existing.setIdempotencyKey(idempotencyKey);

        bookingRepository.save(existing);
        return existing;
    }

    private void claimRequestedSeats(Showtime showtime, List<String> requestedPositions) {
        LocalDateTime now = LocalDateTime.now();
        List<BookingSeat> activeSeats = bookingRepository.findActiveSeats(showtime.getId(), requestedPositions);

        List<String> blockedPositions = new ArrayList<>();
        for (BookingSeat activeSeat : activeSeats) {
            Booking booking = activeSeat.getBooking();
            boolean blocking = BookingStatus.CONFIRMED.equals(booking.getStatus())
                    || (Boolean.TRUE.equals(booking.getOnHold()) && booking.getExpiresAt().isAfter(now));
            if (blocking) {
                blockedPositions.add(activeSeat.getPosition());
            } else {
                // NULL, not false, so repeated releases don't collide on the partial unique constraint.
                activeSeat.setActive(null);
            }
        }

        if (!blockedPositions.isEmpty()) {
            throw new BusinessException("Seat(s) already reserved: " + String.join(", ", blockedPositions));
        }

        // Flush the active=null releases before the caller re-inserts the same seats.
        bookingRepository.flush();
    }

    private BookingSeat buildSeat(Booking booking, Showtime showtime, Hall hall, String position) {
        SeatCategory category = resolvePositionCategory(hall.getLayout(), position);

        BookingSeat seat = new BookingSeat();
        seat.setBooking(booking);
        seat.setShowtime(showtime);
        seat.setPosition(position);
        seat.setCategory(resolvePositionCategory(hall.getLayout(), position));
        seat.setTicketPrice(hall.getCategoryPrices().get(category));
        return seat;
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
