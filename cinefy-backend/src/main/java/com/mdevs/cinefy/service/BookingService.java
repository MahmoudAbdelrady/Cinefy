package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.booking.ActiveBookingDTO;
import com.mdevs.cinefy.dto.booking.BookedSeatDTO;
import com.mdevs.cinefy.dto.booking.BookingDetailDTO;
import com.mdevs.cinefy.dto.booking.BookingRequestDTO;
import com.mdevs.cinefy.dto.booking.BookingSummaryDTO;
import com.mdevs.cinefy.dto.booking.SeatSelectionDTO;
import com.mdevs.cinefy.dto.hall.HallLayout;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.dto.showtime.BookingShowtimeDTO;
import com.mdevs.cinefy.dto.showtime.HallTypeShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimeReservedSeatsProjection;
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
import com.mdevs.cinefy.shared.exception.types.ForbiddenException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    private final CurrentUserService currentUserService;

    @Lazy
    private final BookingService self;

    private static final int HOLD_WINDOW_MINUTES = 10;

    private static final int BOOKING_CUTOFF_MINUTES = 60;

    private static final String REFERENCE_PREFIX = "CINEFY-";

    private static final String REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private static final int REFERENCE_LENGTH = 10;

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    // ========================= Public API =========================

    public List<String> getBookableDates(Long movieId) {
        LocalDateTime cutOffDate = LocalDateTime.now().plusMinutes(BOOKING_CUTOFF_MINUTES);
        return showtimeRepository.findDistinctBookableShowtimeDates(movieId, ShowtimeStatus.COMMITTED_STATUSES, cutOffDate)
                .stream()
                .map(LocalDate::toString)
                .toList();
    }

    public List<HallTypeShowtimesDTO> getBookableShowtimesForDate(Long movieId, LocalDate date) {
        LocalDateTime cutOffDate = LocalDateTime.now().plusMinutes(BOOKING_CUTOFF_MINUTES);
        List<Showtime> showtimes = showtimeRepository.findBookableByMovieAndDateRangeWithHall(movieId, ShowtimeStatus.COMMITTED_STATUSES, date.atStartOfDay(), date.plusDays(1).atStartOfDay(), cutOffDate);

        List<Long> showtimeIds = showtimes.stream().map(Showtime::getId).toList();
        User currentUser = SecurityUtil.isAuthenticated() ? currentUserService.loadCurrentUser() : null;
        Long clientId = currentUser instanceof Client client ? client.getId() : null;
        Long staffId = currentUser instanceof StaffMember staff ? staff.getId() : null;
        Map<Long, Long> reservedSeatsByShowtime = bookingRepository.countReservedSeatsByShowtime(showtimeIds, LocalDateTime.now(), clientId, staffId)
                .stream()
                .collect(Collectors.toMap(ShowtimeReservedSeatsProjection::getShowtimeId, ShowtimeReservedSeatsProjection::getReservedSeats));

        Map<String, List<BookingShowtimeDTO>> grouped = showtimes.stream()
                .collect(Collectors.groupingBy(
                        showtime -> showtime.getHall().getType().getName(),
                        LinkedHashMap::new,
                        Collectors.mapping(
                                showtime -> toBookingShowtime(showtime, reservedSeatsByShowtime.getOrDefault(showtime.getId(), 0L)),
                                Collectors.toList())));

        return grouped.entrySet().stream()
                .map(entry -> new HallTypeShowtimesDTO(entry.getKey(), entry.getValue()))
                .toList();
    }

    public SeatSelectionDTO getSeatSelection(String showtimeUuid) {
        Showtime showtime = findBookableShowtime(showtimeUuid);
        Hall hall = showtime.getHall();
        LocalDateTime now = LocalDateTime.now();

        HallLayoutDTO hallLayout = hallService.getHallLayout(hall);
        List<String> reservedSeats = bookingRepository.findReservedPositions(showtime.getId(), now);
        hallLayout.getLayout().setReserved(reservedSeats);

        ActiveBookingDTO activeBooking = null;
        if (SecurityUtil.isAuthenticated()) {
            User user = currentUserService.loadCurrentUser();
            activeBooking = findOnHoldBooking(showtime.getId(), user, now)
                    .map(this::toActiveBookingDTO)
                    .orElse(null);
        }

        int capacity = hall.getTotalRows() * hall.getTotalColumns();
        boolean fullyReserved = reservedSeats.size() == capacity && activeBooking == null;

        return toSeatSelectionDTO(showtime, hall, hallLayout, activeBooking, fullyReserved);
    }

    public List<BookingSummaryDTO> getActiveBookings() {
        User user = currentUserService.loadCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        List<Booking> bookings = user instanceof Client
                ? bookingRepository.findActiveOnHoldByClient(user.getId(), now)
                : bookingRepository.findActiveOnHoldByBookedBy(user.getId(), now);

        return bookings.stream().map(this::toBookingSummaryDTO).toList();
    }

    public BookingDetailDTO getActiveBookingDetails(String uuid) {
        Booking booking = findBookingByUuidWithDetail(uuid);
        validateBookingOwnership(booking);
        validateBookingIsActive(booking);
        return toBookingDetailDTO(booking);
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
        } catch (DataIntegrityViolationException | ObjectOptimisticLockingFailureException e) {
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

        User user = currentUserService.loadCurrentUser();
        validateSeats(hall, dto.getSeats(), user);

        if (expiredBooking != null) {
            bookingRepository.delete(expiredBooking);
        }

        Booking mutated = mutateActivePendingBooking(user, showtime, hall, dto.getSeats(), idempotencyKey);
        if (mutated != null) {
            return toBookingDetailDTO(mutated);
        }

        Booking booking = buildBooking(showtime, hall, user, idempotencyKey);

        claimRequestedSeats(showtime, dto.getSeats());
        for (String position : dto.getSeats()) {
            booking.getSeats().add(buildSeat(booking, showtime, hall, position));
        }

        bookingRepository.save(booking);

        return toBookingDetailDTO(booking);
    }

    @Transactional
    public void cancelBooking(String uuid) {
        Booking booking = findBookingByUuidWithDetail(uuid);
        validateBookingOwnership(booking);
        validateBookingIsActive(booking);
        bookingRepository.delete(booking);
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
                .orElseThrow(() -> new NotFoundException("Showtime not found"));
        LocalDateTime cutOffDate = LocalDateTime.now().plusMinutes(BOOKING_CUTOFF_MINUTES);
        if (!ShowtimeStatus.COMMITTED_STATUSES.contains(showtime.getStatus())
                || showtime.getEndDateTime().isBefore(cutOffDate)) {
            throw new BusinessException("This showtime is not available for booking");
        }
        return showtime;
    }

    private Booking findBookingByUuidWithDetail(String uuid) {
        return bookingRepository.findByUuidWithDetail(uuid)
                .orElseThrow(() -> new NotFoundException("Booking not found or it may have been expired"));
    }

    private Optional<Booking> findOnHoldBooking(Long showtimeId, User user, LocalDateTime now) {
        return user instanceof Client
                ? bookingRepository.findOnHoldByShowtimeAndClient(showtimeId, user.getId(), now)
                : bookingRepository.findOnHoldByShowtimeAndBookedBy(showtimeId, user.getId(), now);
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

    private void validateBookingOwnership(Booking booking) {
        UserPrincipal currentUser = SecurityUtil.getCurrentUser();
        String ownerUuid = currentUser.getType().equals(UserType.CLIENT)
                ? (booking.getClient() == null ? null : booking.getClient().getUuid())
                : (booking.getBookedBy() == null ? null : booking.getBookedBy().getUuid());
        if (!currentUser.getUuid().equals(ownerUuid)) {
            throw new ForbiddenException("You are not allowed to access this booking");
        }
    }

    private void validateBookingIsActive(Booking booking) {
        boolean active = Boolean.TRUE.equals(booking.getOnHold()) && booking.getExpiresAt().isAfter(LocalDateTime.now());
        if (!active) {
            throw new BusinessException("This booking is no longer active");
        }
    }

    private Booking mutateActivePendingBooking(User user, Showtime showtime, Hall hall,
                                               List<String> requestedPositions, String idempotencyKey) {
        Booking existing = findOnHoldBooking(showtime.getId(), user, null).orElse(null);
        if (existing == null) {
            return null;
        }
        if (!existing.getExpiresAt().isAfter(LocalDateTime.now())) {
            bookingRepository.delete(existing);
            return null;
        }

        Set<String> currentPositions = existing.getSeats().stream()
                .map(BookingSeat::getPosition)
                .collect(Collectors.toSet());
        Set<String> requested = new LinkedHashSet<>(requestedPositions);

        boolean overlaps = requested.stream().anyMatch(currentPositions::contains);
        if (!overlaps) {
            bookingRepository.delete(existing);
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

    private Booking buildBooking(Showtime showtime, Hall hall, User user, String idempotencyKey) {
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

        return booking;
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

    private BookingShowtimeDTO toBookingShowtime(Showtime showtime, long reservedSeats) {
        Hall hall = showtime.getHall();
        int capacity = hall.getTotalRows() * hall.getTotalColumns();
        return new BookingShowtimeDTO(
                showtime.getUuid(),
                showtime.getStartDateTime().toLocalTime().format(TIME_FORMATTER),
                showtime.is3D(),
                reservedSeats >= capacity);
    }

    private SeatSelectionDTO toSeatSelectionDTO(Showtime showtime, Hall hall, HallLayoutDTO hallLayout,
                                                ActiveBookingDTO activeBooking, boolean fullyReserved) {
        SeatSelectionDTO dto = new SeatSelectionDTO();
        dto.setMovieTitle(showtime.getTmdbMovie().getTitle());
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setHallName(hall.getName());
        dto.setHallType(hall.getType().getName());
        dto.set3D(showtime.is3D());
        dto.setFullyReserved(fullyReserved);
        dto.setHallLayout(hallLayout);
        dto.setActiveBooking(activeBooking);
        return dto;
    }

    private ActiveBookingDTO toActiveBookingDTO(Booking booking) {
        List<String> seats = booking.getSeats().stream()
                .map(BookingSeat::getPosition)
                .toList();
        return new ActiveBookingDTO(booking.getUuid(), seats, booking.getExpiresAt());
    }

    private BookingDetailDTO toBookingDetailDTO(Booking booking) {
        List<BookedSeatDTO> seats = booking.getSeats().stream()
                .map(seat -> new BookedSeatDTO(seat.getPosition(), seat.getCategory(), seat.getTicketPrice()))
                .toList();

        Showtime showtime = booking.getShowtime();

        BookingDetailDTO dto = new BookingDetailDTO();
        dto.setId(booking.getUuid());
        dto.setExpiresAt(booking.getExpiresAt());
        dto.setMovie(tmdbMovieService.toSearchResult(showtime.getTmdbMovie()));
        dto.setShowtimeId(showtime.getUuid());
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setHallName(booking.getHallName());
        dto.setHallType(booking.getHallType());
        dto.set3D(showtime.is3D());
        dto.setSeats(seats);
        return dto;
    }

    private BookingSummaryDTO toBookingSummaryDTO(Booking booking) {
        int totalTickets = booking.getSeats().size();
        BigDecimal totalPrice = booking.getSeats().stream()
                .map(BookingSeat::getTicketPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Showtime showtime = booking.getShowtime();

        return new BookingSummaryDTO(
                booking.getUuid(),
                booking.getExpiresAt(),
                tmdbMovieService.toSearchResult(showtime.getTmdbMovie()),
                showtime.getStartDateTime(),
                booking.getHallName(),
                booking.getHallType(),
                showtime.is3D(),
                totalTickets,
                totalPrice);
    }
}
