package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.dto.showtime.ShowtimeBookedSeatsProjection;
import com.mdevs.cinefy.dto.showtime.ShowtimeBookingCountsProjection;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.BookingSeat;
import com.mdevs.cinefy.entity.enums.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface BookingRepository extends BaseRepository<Booking> {

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            JOIN FETCH b.showtime s
            JOIN FETCH s.tmdbMovie
            WHERE b.idempotencyKey = :idempotencyKey
            """)
    Optional<Booking> findByIdempotencyKeyWithDetail(@Param("idempotencyKey") String idempotencyKey);

    @Query("""
            SELECT bs FROM BookingSeat bs
            JOIN FETCH bs.booking b
            WHERE bs.showtime.id = :showtimeId
            AND bs.position IN :positions
            AND bs.active = true
            """)
    List<BookingSeat> findActiveSeats(@Param("showtimeId") Long showtimeId,
                                      @Param("positions") List<String> positions);

    @Query("""
            SELECT bs.position FROM BookingSeat bs
            WHERE bs.showtime.id = :showtimeId
            AND (bs.booking.status = 'CONFIRMED' OR (bs.booking.onHold = true AND bs.booking.expiresAt > :now))
            """)
    List<String> findBookedPositions(@Param("showtimeId") Long showtimeId,
                                     @Param("now") LocalDateTime now);

    @Query("""
            SELECT CASE WHEN COUNT(bs.id) > 0 THEN true ELSE false END
            FROM BookingSeat bs
            JOIN bs.booking b
            WHERE bs.showtime.id IN :showtimeIds
            AND (b.status = 'CONFIRMED' OR (b.onHold = true AND b.expiresAt > :now))
            """)
    boolean existsBookedSeatByShowtimeIn(@Param("showtimeIds") List<Long> showtimeIds,
                                         @Param("now") LocalDateTime now);

    boolean existsByPaymentTransactionId(String paymentTransactionId);

    @Query("""
            SELECT CASE WHEN COUNT(b.id) > 0 THEN true ELSE false END
            FROM Booking b
            WHERE b.paymentGateway.id = :gatewayId
            AND (b.status = 'PENDING_PAYMENT'
                 OR (b.status IN ('CONFIRMED', 'REFUNDED') AND b.updatedAt > :startDate))
            """)
    boolean existsActivityByGateway(@Param("gatewayId") Long gatewayId,
                                    @Param("startDate") LocalDateTime startDate);

    @Query("""
            SELECT bs.showtime.id AS showtimeId, COUNT(bs.id) AS bookedSeats
            FROM BookingSeat bs
            JOIN bs.booking b
            WHERE bs.showtime.id IN :showtimeIds
            AND (b.status = 'CONFIRMED'
                 OR (b.onHold = true
                     AND b.expiresAt > :now
                     AND (:clientId IS NULL OR b.client.id IS NULL OR b.client.id != :clientId)
                     AND (:staffId IS NULL OR b.bookedBy.id IS NULL OR b.bookedBy.id != :staffId)))
            GROUP BY bs.showtime.id
            """)
    List<ShowtimeBookedSeatsProjection> countBookedSeatsByShowtime(@Param("showtimeIds") List<Long> showtimeIds,
                                                                   @Param("now") LocalDateTime now,
                                                                   @Param("clientId") Long clientId,
                                                                   @Param("staffId") Long staffId);

    @Query("""
            SELECT bs.showtime.id AS showtimeId,
                   COUNT(bs.id) AS bookedSeats,
                   COUNT(CASE WHEN b.bookedBy.id = :staffId AND b.status IS NULL AND b.onHold = true THEN 1 END) AS myOnHoldSeats
            FROM BookingSeat bs
            JOIN bs.booking b
            WHERE bs.showtime.id IN :showtimeIds
            AND (b.status = 'CONFIRMED' OR (b.onHold = true AND b.expiresAt > :now))
            GROUP BY bs.showtime.id
            """)
    List<ShowtimeBookingCountsProjection> countBookedAndHeldByShowtime(@Param("showtimeIds") List<Long> showtimeIds,
                                                                       @Param("now") LocalDateTime now,
                                                                       @Param("staffId") Long staffId);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            WHERE b.showtime.id = :showtimeId
            AND b.onHold = true
            AND (CAST(:now AS LocalDateTime) IS NULL OR b.expiresAt > :now)
            AND b.client.id = :clientId
            """)
    Optional<Booking> findOnHoldByShowtimeAndClient(@Param("showtimeId") Long showtimeId,
                                                    @Param("clientId") Long clientId,
                                                    @Param("now") LocalDateTime now);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            WHERE b.showtime.id = :showtimeId
            AND b.onHold = true
            AND (CAST(:now AS LocalDateTime) IS NULL OR b.expiresAt > :now)
            AND b.bookedBy.id = :staffId
            """)
    Optional<Booking> findOnHoldByShowtimeAndBookedBy(@Param("showtimeId") Long showtimeId,
                                                      @Param("staffId") Long staffId,
                                                      @Param("now") LocalDateTime now);

    @Query("""
            SELECT b.id FROM Booking b
            WHERE b.onHold = true
            AND b.expiresAt < :cutOffDate
            ORDER BY b.expiresAt
            """)
    List<Long> findExpiredPendingIds(@Param("cutOffDate") LocalDateTime cutOffDate, Pageable pageable);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            JOIN FETCH b.showtime s
            JOIN FETCH s.tmdbMovie
            WHERE b.onHold = true
            AND b.expiresAt > :now
            AND b.client.id = :clientId
            ORDER BY b.id
            """)
    List<Booking> findActiveOnHoldByClient(@Param("clientId") Long clientId, @Param("now") LocalDateTime now);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            JOIN FETCH b.showtime s
            JOIN FETCH s.tmdbMovie
            WHERE b.onHold = true
            AND b.expiresAt > :now
            AND b.bookedBy.id = :staffId
            ORDER BY b.id
            """)
    List<Booking> findActiveOnHoldByBookedBy(@Param("staffId") Long staffId, @Param("now") LocalDateTime now);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            JOIN FETCH b.showtime s
            JOIN FETCH s.tmdbMovie
            WHERE b.uuid = :uuid
            """)
    Optional<Booking> findByUuidWithDetail(@Param("uuid") String uuid);

    @Query(value = """
            SELECT b FROM Booking b
            JOIN FETCH b.showtime s
            JOIN FETCH s.tmdbMovie
            WHERE b.client.id = :clientId
            AND b.status IN :statuses
            ORDER BY s.startDateTime DESC
            """,
            countQuery = """
                    SELECT COUNT(b) FROM Booking b
                    WHERE b.client.id = :clientId
                    AND b.status IN :statuses
                    """)
    Page<Booking> findSettledByClient(@Param("clientId") Long clientId,
                                      @Param("statuses") Set<BookingStatus> statuses,
                                      Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.uuid = :uuid")
    Optional<Booking> findByUuidForUpdate(@Param("uuid") String uuid);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.bookingReference = :bookingReference")
    Optional<Booking> findByBookingReferenceForUpdate(@Param("bookingReference") String bookingReference);

    @Modifying
    @Query("DELETE FROM BookingSeat bs WHERE bs.booking.id IN :bookingIds")
    void deleteSeatsByBookingIds(@Param("bookingIds") List<Long> bookingIds);

    @Modifying
    @Query("DELETE FROM Booking b WHERE b.id IN :bookingIds")
    int deleteBookingsByIds(@Param("bookingIds") List<Long> bookingIds);
}
