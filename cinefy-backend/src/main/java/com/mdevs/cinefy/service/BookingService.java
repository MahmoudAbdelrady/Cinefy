package com.mdevs.cinefy.service;

import com.mdevs.cinefy.config.general.AppConfig;
import com.mdevs.cinefy.dto.booking.ActiveBookingDTO;
import com.mdevs.cinefy.dto.booking.BookedSeatDTO;
import com.mdevs.cinefy.dto.booking.BookingConfirmationDTO;
import com.mdevs.cinefy.dto.booking.BookingDetailDTO;
import com.mdevs.cinefy.dto.booking.BookingRequestDTO;
import com.mdevs.cinefy.dto.booking.BookingSummaryDTO;
import com.mdevs.cinefy.dto.booking.PastBookingDTO;
import com.mdevs.cinefy.dto.booking.OnSitePaymentDTO;
import com.mdevs.cinefy.dto.booking.SeatSelectionDTO;
import com.mdevs.cinefy.dto.hall.HallLayout;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.dto.payment.PaymentAttemptDTO;
import com.mdevs.cinefy.dto.RedirectionDTO;
import com.mdevs.cinefy.dto.payment.PaymobPayResponseDTO;
import com.mdevs.cinefy.dto.payment.SavedCardPaymentDTO;
import com.mdevs.cinefy.dto.payment.TransactionCallbackDTO;
import com.mdevs.cinefy.dto.showtime.BookingShowtimeDTO;
import com.mdevs.cinefy.dto.showtime.HallTypeShowtimesDTO;
import com.mdevs.cinefy.projection.showtime.ShowtimeBookedSeatsProjection;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.BookingSeat;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.ClientPaymentMethod;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.User;
import com.mdevs.cinefy.entity.enums.BookingStatus;
import com.mdevs.cinefy.entity.enums.PaymentState;
import com.mdevs.cinefy.entity.enums.SeatCategory;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.repository.BookingRepository;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.dto.email.InlineResource;
import com.mdevs.cinefy.shared.QrGenerator;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.ConflictException;
import com.mdevs.cinefy.shared.exception.types.ForbiddenException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    private final PaymentService paymentService;

    private final ClientPaymentMethodService clientPaymentMethodService;

    private final QrGenerator qrGenerator;

    private final EmailService emailService;

    @Lazy
    private final BookingService self;

    private static final int HOLD_WINDOW_MINUTES = 10;

    private static final int BOOKING_CUTOFF_MINUTES = 60;

    private static final double MAX_SEATS_CAPACITY_RATIO = 0.20;

    private static final int MAX_SEATS_MINIMUM = 6;

    private static final String REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private static final int REFERENCE_LENGTH = 10;

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private static final String BOOKING_CONFIRMATION_PATH = "/booking-confirmation/";

    private static final String TICKET_QR_CONTENT_ID = "ticket-qr";

    private static final String TICKET_QR_CONTENT_TYPE = "image/png";

    // ========================= Public API =========================

    public static boolean isBookable(Showtime showtime) {
        return ShowtimeStatus.COMMITTED_STATUSES.contains(showtime.getStatus())
                && !showtime.getEndDateTime().isBefore(LocalDateTime.now().plusMinutes(BOOKING_CUTOFF_MINUTES));
    }

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
        Map<Long, Integer> bookedSeatsByShowtime = bookingRepository.countBookedSeatsByShowtime(showtimeIds, LocalDateTime.now(), clientId, staffId)
                .stream()
                .collect(Collectors.toMap(ShowtimeBookedSeatsProjection::getShowtimeId, ShowtimeBookedSeatsProjection::getBookedSeats));

        Map<String, List<BookingShowtimeDTO>> grouped = showtimes.stream()
                .collect(Collectors.groupingBy(
                        showtime -> showtime.getHall().getType().getName(),
                        LinkedHashMap::new,
                        Collectors.mapping(
                                showtime -> toBookingShowtime(showtime, bookedSeatsByShowtime.getOrDefault(showtime.getId(), 0)),
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
        List<String> bookedSeats = bookingRepository.findBookedPositions(showtime.getId(), now);
        hallLayout.getLayout().setBooked(bookedSeats);

        ActiveBookingDTO activeBooking = null;
        if (SecurityUtil.isAuthenticated()) {
            User user = currentUserService.loadCurrentUser();
            activeBooking = findOnHoldBooking(showtime.getId(), user, now)
                    .map(this::toActiveBookingDTO)
                    .orElse(null);
        }

        boolean fullyBooked = bookedSeats.size() == hall.getCapacity() && activeBooking == null;

        return toSeatSelectionDTO(showtime, hall, hallLayout, activeBooking, fullyBooked);
    }

    public List<BookingSummaryDTO> getActiveBookings() {
        User user = currentUserService.loadCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        List<Booking> bookings = user instanceof Client
                ? bookingRepository.findActiveOnHoldByClient(user.getId(), now)
                : bookingRepository.findActiveOnHoldByBookedBy(user.getId(), now);

        return bookings.stream()
                .filter(booking -> isBookable(booking.getShowtime()))
                .map(this::toBookingSummaryDTO)
                .toList();
    }

    public Page<PastBookingDTO> getPastBookings(Pageable pageable) {
        User user = currentUserService.loadCurrentUser();
        if (!(user instanceof Client client)) {
            throw new BusinessException("Only clients have a booking history");
        }
        return bookingRepository.findSettledByClient(client.getId(), BookingStatus.SETTLED_STATUSES, pageable)
                .map(this::toPastBookingDTO);
    }

    public BookingConfirmationDTO getPastBookingDetails(String uuid) {
        Booking booking = findBookingByUuidWithDetail(uuid);
        validateBookingOwnership(booking);
        if (!BookingStatus.isSettled(booking.getStatus())) {
            throw new BusinessException("This booking has not been settled yet");
        }
        return toBookingConfirmationDTO(booking);
    }

    public BookingDetailDTO getActiveBookingDetails(String uuid) {
        Booking booking = findBookingByUuidWithDetail(uuid);
        validateBookingOwnership(booking);
        validateBookingIsActive(booking);
        validateShowtimeStillBookable(booking);
        return toBookingDetailDTO(booking);
    }

    public BookingConfirmationDTO getBookingConfirmation(String uuid) {
        Booking booking = findBookingByUuidWithDetail(uuid);
        validateBookingOwnership(booking);
        if (booking.getStatus() == null) {
            throw new BusinessException("No payment has been attempted for this booking", ErrorCode.PAYMENT_NOT_ATTEMPTED);
        }
        return toBookingConfirmationDTO(booking);
    }

    public BookingDetailDTO createBooking(BookingRequestDTO dto, String idempotencyKey) {
        Booking existing = bookingRepository.findByIdempotencyKeyWithDetail(idempotencyKey).orElse(null);
        boolean hasExpiredPending = existing != null && Boolean.TRUE.equals(existing.getOnHold()) && existing.hasExpired();
        if (existing != null && !hasExpiredPending) {
            return toBookingDetailDTO(existing);
        }

        try {
            return self.persistBooking(dto, idempotencyKey, existing);
        } catch (DataIntegrityViolationException | ObjectOptimisticLockingFailureException e) {
            log.warn("Booking save conflict for idempotency key {}: {}", idempotencyKey, e.getMessage(), e);
            BookingDetailDTO recovered = findExistingBooking(idempotencyKey);
            if (recovered == null) {
                throw new ConflictException("One or more selected seats have been taken");
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
        applySeatsTotal(booking);

        bookingRepository.save(booking);

        return toBookingDetailDTO(booking);
    }

    @Transactional
    public void cancelBooking(String uuid) {
        Booking booking = findBookingByUuidForUpdate(uuid);
        validateBookingOwnership(booking);
        validateBookingIsActive(booking);
        bookingRepository.delete(booking);
    }

    @Transactional
    public BookingConfirmationDTO settleOnSitePayment(String uuid, OnSitePaymentDTO dto) {
        Booking booking = lockAndFetchBookingWithDetail(uuid);

        validateBookingOwnership(booking);

        if (BookingStatus.isSettled(booking.getStatus())) {
            return toBookingConfirmationDTO(booking);
        }
        if (booking.hasExpired()) {
            throw new BusinessException("This booking has expired");
        }
        if (!Boolean.TRUE.equals(dto.getIsCash()) && StringUtils.isEmpty(dto.getTransactionId())) {
            throw new BusinessException("A transaction id is required for card payments");
        }
        if (StringUtils.isNotEmpty(dto.getTransactionId()) && bookingRepository.existsByPaymentTransactionId(dto.getTransactionId())) {
            throw new BusinessException("This transaction id is already recorded on another booking");
        }

        confirmPaidBooking(booking, dto.getTransactionId());

        return toBookingConfirmationDTO(booking);
    }

    @Transactional
    public BookingConfirmationDTO scanTicket(String bookingReference) {
        Booking locked = bookingRepository.findByBookingReferenceForUpdate(bookingReference)
                .orElseThrow(() -> new NotFoundException("No booking matches this reference"));

        validateTicketIsRedeemable(locked);

        locked.setTicketUsed(true);
        bookingRepository.save(locked);

        // Re-read to fetch the associations in one join instead of lazy-loading them one by one
        return toBookingConfirmationDTO(findBookingByUuidWithDetail(locked.getUuid()));
    }

    @Transactional
    public RedirectionDTO createPaymentCheckout(String uuid) {
        Booking booking = prepareBookingForPayment(uuid);
        PaymentAttemptDTO attempt = paymentService.createCheckout(booking);

        booking.setPaymentGateway(attempt.gateway());
        bookingRepository.save(booking);

        return attempt.redirection();
    }

    @Transactional
    public RedirectionDTO paySavedCard(String uuid, SavedCardPaymentDTO dto) {
        Booking booking = prepareBookingForPayment(uuid);
        ClientPaymentMethod paymentMethod = clientPaymentMethodService.findOwnedByCurrentClient(dto.getPaymentMethodId());

        PaymentAttemptDTO attempt = paymentService.payWithSavedCard(booking, paymentMethod);
        PaymobPayResponseDTO result = attempt.payment();

        booking.setPaymentGateway(attempt.gateway());

        if (result.success()) {
            confirmPaidBooking(booking, result.id());
            return new RedirectionDTO(buildBookingConfirmationUrl(booking.getUuid()));
        }
        if (result.pending()) {
            bookingRepository.save(booking);
            return new RedirectionDTO(result.redirectionUrl());
        }

        throw new BusinessException(StringUtils.defaultIfEmpty(result.message(), "The payment was declined"));
    }

    @Transactional
    public void applyPaymentResult(TransactionCallbackDTO transaction) {
        String bookingUuid = parsePaymentBookingUuid(transaction.orderReference());
        Booking booking = bookingRepository.findByUuidForUpdate(bookingUuid).orElse(null);

        boolean expired = booking != null && !BookingStatus.isSettled(booking.getStatus()) && booking.hasExpired();

        if (booking == null || expired) {
            if (transaction.success() && !(transaction.isVoided() || transaction.isRefunded())) {
                log.warn("Successful payment for a booking that is no longer claimable: bookingUuid={} expired={}", bookingUuid, expired);
                paymentService.refundTransaction(transaction.orderReference(), transaction.id(), transaction.amountCents());
            }
            return;
        }

        if (transaction.isRefunded() || transaction.isVoided()) {
            if (!transaction.id().equals(booking.getPaymentTransactionId())) {
                log.warn("Refund callback for a transaction that did not settle this booking: bookingUuid={} settledBy={} refunded={}", bookingUuid, booking.getPaymentTransactionId(), transaction.id());
                return;
            }

            booking.setStatus(BookingStatus.REFUNDED);
            bookingRepository.save(booking);
            return;
        }
        if (!transaction.success()) {
            if (BookingStatus.PENDING_PAYMENT.equals(booking.getStatus())) {
                // Marks the booking as having a failed attempt; cleared when a new payment starts
                booking.setPaymentTransactionId(transaction.id());
                bookingRepository.save(booking);
            }
            return;
        }

        BookingStatus status = booking.getStatus();
        if (BookingStatus.isSettled(status)) {
            if (transaction.id().equals(booking.getPaymentTransactionId())) {
                log.info("Payment callback for a booking already settled by this transaction: bookingUuid={} status={} transactionId={}", bookingUuid, status, transaction.id());
                return;
            }

            log.warn("Successful payment for a booking already settled by another transaction: bookingUuid={} status={} settledBy={} chargedBy={}", bookingUuid, status, booking.getPaymentTransactionId(), transaction.id());
            paymentService.refundTransaction(transaction.orderReference(), transaction.id(), transaction.amountCents());
            return;
        }

        confirmPaidBooking(findBookingByUuidWithDetail(bookingUuid), transaction.id());
    }

    public String resolvePaymentRedirectUrl(TransactionCallbackDTO transaction) {
        if (transaction == null) {
            return AppConfig.getFrontendClientUrl();
        }
        return buildBookingConfirmationUrl(parsePaymentBookingUuid(transaction.orderReference()));
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
                .orElseThrow(() -> new NotFoundException("Showtime not found or it may no longer be available"));
        if (!isBookable(showtime)) {
            throw new BusinessException("This showtime is not available for booking");
        }
        return showtime;
    }

    private Booking findBookingByUuidWithDetail(String uuid) {
        return bookingRepository.findByUuidWithDetail(uuid)
                .orElseThrow(() -> new NotFoundException("Booking not found or it may have been expired"));
    }

    private Booking findBookingByUuidForUpdate(String uuid) {
        return bookingRepository.findByUuidForUpdate(uuid)
                .orElseThrow(() -> new NotFoundException("Booking not found or it may have been expired"));
    }

    private Booking lockAndFetchBookingWithDetail(String uuid) {
        // Lock first, then re-read to fetch the associations in one join instead of lazy-loading them one by one
        findBookingByUuidForUpdate(uuid);
        return findBookingByUuidWithDetail(uuid);
    }

    private Optional<Booking> findOnHoldBooking(Long showtimeId, User user, LocalDateTime now) {
        return user instanceof Client
                ? bookingRepository.findOnHoldByShowtimeAndClient(showtimeId, user.getId(), now)
                : bookingRepository.findOnHoldByShowtimeAndBookedBy(showtimeId, user.getId(), now);
    }

    private void validateSeats(Hall hall, List<String> requestedPositions, User user) {
        HallLayout layout = hall.getLayout();

        int maxSeats = Math.max(MAX_SEATS_MINIMUM, (int) (hall.getCapacity() * MAX_SEATS_CAPACITY_RATIO));
        if (requestedPositions.size() > maxSeats) {
            throw new BusinessException("You can book at most " + maxSeats + " seats per booking");
        }

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
        if (!booking.isActiveHold()) {
            throw new BusinessException("This booking is no longer active");
        }
    }

    private void validateShowtimeStillBookable(Booking booking) {
        if (!isBookable(booking.getShowtime())) {
            throw new BusinessException("This showtime is no longer available for booking");
        }
    }

    private void validateTicketIsRedeemable(Booking booking) {
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("This booking is not confirmed");
        }
        if (booking.isTicketUsed()) {
            throw new BusinessException("This ticket has already been used");
        }
    }

    private void confirmPaidBooking(Booking booking, String transactionId) {
        String bookingReference = generateReference();
        byte[] qrCode = qrGenerator.generate(bookingReference);

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setOnHold(null);
        booking.setPaymentTransactionId(transactionId);
        booking.setBookingReference(bookingReference);
        booking.setTicketQrCode(QrGenerator.toDataUri(qrCode));
        bookingRepository.save(booking);

        sendTicketEmail(booking, qrCode);
    }

    private void sendTicketEmail(Booking booking, byte[] qrCode) {
        Client client = booking.getClient();
        if (client == null) {
            return;
        }

        List<String> seats = booking.getSeats().stream()
                .map(BookingSeat::getPosition)
                .sorted(HallService.POSITION_COMPARATOR)
                .toList();

        Map<String, Object> variables = Map.of(
                "booking", booking,
                "seats", seats);

        emailService.sendBookingTicket(
                client.getEmail(),
                variables,
                List.of(new InlineResource(TICKET_QR_CONTENT_ID, TICKET_QR_CONTENT_TYPE, qrCode)));
    }

    private Booking prepareBookingForPayment(String uuid) {
        Booking booking = lockAndFetchBookingWithDetail(uuid);

        validateBookingOwnership(booking);
        validateBookingIsActive(booking);
        validateShowtimeStillBookable(booking);

        BookingStatus status = booking.getStatus();
        if (BookingStatus.isSettled(status)) {
            throw new BusinessException("This booking has already been paid for");
        }
        if (status == null) {
            booking.setExpiresAt(LocalDateTime.now().plusMinutes(HOLD_WINDOW_MINUTES));
            booking.setStatus(BookingStatus.PENDING_PAYMENT);
        }
        booking.setPaymentTransactionId(null);

        return booking;
    }

    private Booking mutateActivePendingBooking(User user, Showtime showtime, Hall hall,
                                               List<String> requestedPositions, String idempotencyKey) {
        Booking existing = findOnHoldBooking(showtime.getId(), user, null).orElse(null);
        if (existing == null) {
            return null;
        }
        if (existing.hasExpired()) {
            bookingRepository.delete(existing);
            return null;
        }
        Set<String> currentPositions = existing.getSeats().stream()
                .map(BookingSeat::getPosition)
                .collect(Collectors.toSet());
        Set<String> requested = new LinkedHashSet<>(requestedPositions);

        if (requested.equals(currentPositions)) {
            return existing;
        }
        if (BookingStatus.PENDING_PAYMENT.equals(existing.getStatus())) {
            throw new BusinessException("A payment is already in progress for this booking. Complete or cancel it before changing seats");
        }

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
        applySeatsTotal(existing);

        bookingRepository.save(existing);
        return existing;
    }

    private void claimRequestedSeats(Showtime showtime, List<String> requestedPositions) {
        LocalDateTime now = LocalDateTime.now();
        List<BookingSeat> activeSeats = bookingRepository.findActiveSeats(showtime.getId(), requestedPositions);

        List<String> blockedPositions = new ArrayList<>();
        for (BookingSeat activeSeat : activeSeats) {
            Booking booking = activeSeat.getBooking();
            boolean blocking = BookingStatus.CONFIRMED.equals(booking.getStatus()) || booking.isActiveHold(now);
            if (blocking) {
                blockedPositions.add(activeSeat.getPosition());
            } else {
                // NULL, not false, so repeated releases don't collide on the partial unique constraint.
                activeSeat.setActive(null);
            }
        }

        if (!blockedPositions.isEmpty()) {
            throw new BusinessException("Seat(s) already booked: " + String.join(", ", blockedPositions));
        }

        // Flush the active=null releases before the caller re-inserts the same seats.
        bookingRepository.flush();
    }

    private void applySeatsTotal(Booking booking) {
        booking.setTotalAmount(booking.getSeats().stream()
                .map(BookingSeat::getTicketPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private Booking buildBooking(Showtime showtime, Hall hall, User user, String idempotencyKey) {
        Booking booking = new Booking();
        booking.setShowtime(showtime);
        booking.setHall(hall);
        booking.setHallName(hall.getName());
        booking.setHallType(hall.getType().getName());
        booking.setIdempotencyKey(idempotencyKey);
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
        StringBuilder reference = new StringBuilder(REFERENCE_LENGTH);
        for (int i = 0; i < REFERENCE_LENGTH; i++) {
            reference.append(REFERENCE_ALPHABET.charAt(RANDOM.nextInt(REFERENCE_ALPHABET.length())));
        }
        return reference.toString();
    }

    private BookingShowtimeDTO toBookingShowtime(Showtime showtime, int bookedSeats) {
        Hall hall = showtime.getHall();
        return new BookingShowtimeDTO(
                showtime.getUuid(),
                showtime.getStartDateTime().toLocalTime().format(TIME_FORMATTER),
                showtime.is3D(),
                bookedSeats >= hall.getCapacity());
    }

    private SeatSelectionDTO toSeatSelectionDTO(Showtime showtime, Hall hall, HallLayoutDTO hallLayout,
                                                ActiveBookingDTO activeBooking, boolean fullyBooked) {
        SeatSelectionDTO dto = new SeatSelectionDTO();
        dto.setMovieTitle(showtime.getTmdbMovie().getTitle());
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setHallName(hall.getName());
        dto.setHallType(hall.getType().getName());
        dto.set3D(showtime.is3D());
        dto.setFullyBooked(fullyBooked);
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
        dto.setTotalPrice(booking.getTotalAmount());
        return dto;
    }

    private BookingConfirmationDTO toBookingConfirmationDTO(Booking booking) {
        List<BookedSeatDTO> seats = booking.getSeats().stream()
                .map(seat -> new BookedSeatDTO(seat.getPosition(), seat.getCategory(), seat.getTicketPrice()))
                .toList();

        PaymentState paymentState = resolvePaymentState(booking);
        Showtime showtime = booking.getShowtime();

        BookingConfirmationDTO dto = new BookingConfirmationDTO();
        dto.setId(booking.getUuid());
        dto.setPaymentState(paymentState);
        dto.setBookingReference(booking.getBookingReference());
        dto.setQrCode(booking.getTicketQrCode());
        dto.setMovie(tmdbMovieService.toSearchResult(showtime.getTmdbMovie()));
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setHallName(booking.getHallName());
        dto.setHallType(booking.getHallType());
        dto.set3D(showtime.is3D());
        dto.setSeats(seats);
        dto.setTotalPrice(booking.getTotalAmount());
        return dto;
    }

    private PastBookingDTO toPastBookingDTO(Booking booking) {
        Showtime showtime = booking.getShowtime();

        return new PastBookingDTO(
                booking.getUuid(),
                tmdbMovieService.toSearchResult(showtime.getTmdbMovie()),
                showtime.getStartDateTime(),
                booking.getHallType(),
                showtime.is3D(),
                booking.getStatus().equals(BookingStatus.REFUNDED),
                booking.getTotalAmount());
    }

    private BookingSummaryDTO toBookingSummaryDTO(Booking booking) {
        int totalTickets = booking.getSeats().size();
        Showtime showtime = booking.getShowtime();

        return new BookingSummaryDTO(
                booking.getUuid(),
                showtime.getUuid(),
                booking.getExpiresAt(),
                tmdbMovieService.toSearchResult(showtime.getTmdbMovie()),
                showtime.getStartDateTime(),
                booking.getHallName(),
                booking.getHallType(),
                showtime.is3D(),
                totalTickets,
                booking.getTotalAmount());
    }

    private String buildBookingConfirmationUrl(String bookingUuid) {
        return AppConfig.getFrontendClientUrl() + BOOKING_CONFIRMATION_PATH + bookingUuid;
    }

    private PaymentState resolvePaymentState(Booking booking) {
        BookingStatus status = booking.getStatus();
        if (status.equals(BookingStatus.CONFIRMED)) {
            return PaymentState.CONFIRMED;
        }
        if (status.equals(BookingStatus.REFUNDED)) {
            return PaymentState.REFUNDED;
        }
        if (booking.hasExpired()) {
            return PaymentState.EXPIRED;
        }
        if (booking.getPaymentTransactionId() == null) {
            return PaymentState.PENDING;
        }
        return PaymentState.FAILED;
    }

    private String parsePaymentBookingUuid(String orderReference) {
        if (StringUtils.isEmpty(orderReference)) {
            throw new BusinessException("Payment callback is missing the order reference");
        }

        String uuid = StringUtils.substringBefore(orderReference, PaymentService.REFERENCE_SEPARATOR);
        if (StringUtils.isEmpty(uuid)) {
            throw new BusinessException("Unrecognized order reference: " + orderReference);
        }
        return uuid;
    }
}
