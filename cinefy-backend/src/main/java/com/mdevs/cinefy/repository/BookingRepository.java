package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.projection.showtime.ShowtimeBookedSeatsProjection;
import com.mdevs.cinefy.projection.showtime.ShowtimeBookingCountsProjection;
import com.mdevs.cinefy.projection.statistics.MovieTicketsSoldProjection;
import com.mdevs.cinefy.projection.statistics.RevenueProjection;
import com.mdevs.cinefy.projection.statistics.StartDateTimeRevenueProjection;
import com.mdevs.cinefy.projection.statistics.StartDateTimeTicketsSoldProjection;
import com.mdevs.cinefy.projection.statistics.TicketsSoldProjection;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.BookingSeat;
import com.mdevs.cinefy.entity.enums.BookingStatus;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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
                                     @Param("now") Instant now);

    @Query("""
            SELECT CASE WHEN COUNT(bs.id) > 0 THEN true ELSE false END
            FROM BookingSeat bs
            JOIN bs.booking b
            WHERE bs.showtime.id IN :showtimeIds
            AND (b.status = 'CONFIRMED' OR (b.onHold = true AND b.expiresAt > :now))
            """)
    boolean existsBookedSeatByShowtimeIn(@Param("showtimeIds") List<Long> showtimeIds,
                                         @Param("now") Instant now);

    boolean existsByPaymentTransactionId(String paymentTransactionId);

    @Query("""
            SELECT CASE WHEN COUNT(b.id) > 0 THEN true ELSE false END
            FROM Booking b
            WHERE b.paymentGateway.id = :gatewayId
            AND (b.status = 'PENDING_PAYMENT'
                 OR (b.status IN ('CONFIRMED', 'REFUNDED') AND b.updatedAt > :startDate))
            """)
    boolean existsActivityByGateway(@Param("gatewayId") Long gatewayId,
                                    @Param("startDate") Instant startDate);

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
                                                                   @Param("now") Instant now,
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
                                                                       @Param("now") Instant now,
                                                                       @Param("staffId") Long staffId);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            WHERE b.showtime.id = :showtimeId
            AND b.onHold = true
            AND (CAST(:now AS Instant) IS NULL OR b.expiresAt > :now)
            AND b.client.id = :clientId
            """)
    Optional<Booking> findOnHoldByShowtimeAndClient(@Param("showtimeId") Long showtimeId,
                                                    @Param("clientId") Long clientId,
                                                    @Param("now") Instant now);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            WHERE b.showtime.id = :showtimeId
            AND b.onHold = true
            AND (CAST(:now AS Instant) IS NULL OR b.expiresAt > :now)
            AND b.bookedBy.id = :staffId
            """)
    Optional<Booking> findOnHoldByShowtimeAndBookedBy(@Param("showtimeId") Long showtimeId,
                                                      @Param("staffId") Long staffId,
                                                      @Param("now") Instant now);

    @Query("""
            SELECT b.id FROM Booking b
            WHERE b.onHold = true
            AND b.expiresAt < :cutOffDate
            ORDER BY b.expiresAt
            """)
    List<Long> findExpiredPendingIds(@Param("cutOffDate") Instant cutOffDate, Pageable pageable);

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
    List<Booking> findActiveOnHoldByClient(@Param("clientId") Long clientId, @Param("now") Instant now);

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
    List<Booking> findActiveOnHoldByBookedBy(@Param("staffId") Long staffId, @Param("now") Instant now);

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
            ORDER BY b.createdAt DESC
            """,
            countQuery = """
                    SELECT COUNT(b) FROM Booking b
                    WHERE b.client.id = :clientId
                    AND b.status IN :statuses
                    """)
    Page<Booking> findSettledByClient(@Param("clientId") Long clientId,
                                      @Param("statuses") Set<BookingStatus> statuses,
                                      Pageable pageable);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.statistics.RevenueProjection(
                COALESCE(SUM(CASE WHEN s.startDateTime >= :from AND b.status = 'CONFIRMED' THEN b.totalAmount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN s.startDateTime >= :from AND b.status = 'REFUNDED' THEN b.totalAmount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN s.startDateTime < :from AND b.status = 'CONFIRMED' THEN b.totalAmount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN s.startDateTime < :from AND b.status = 'REFUNDED' THEN b.totalAmount ELSE 0 END), 0))
            FROM Booking b
            JOIN b.showtime s
            WHERE s.status IN :statuses
            AND s.startDateTime BETWEEN :previousFrom AND :to
            """)
    RevenueProjection sumRevenueBetween(@Param("statuses") Set<ShowtimeStatus> statuses,
                                        @Param("previousFrom") Instant previousFrom,
                                        @Param("from") Instant from,
                                        @Param("to") Instant to);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.statistics.TicketsSoldProjection(
                COUNT(CASE WHEN s.startDateTime >= :from THEN 1 END),
                COUNT(CASE WHEN s.startDateTime < :from THEN 1 END))
            FROM BookingSeat bs
            JOIN bs.booking b
            JOIN bs.showtime s
            WHERE b.status = 'CONFIRMED'
            AND s.status IN :statuses
            AND s.startDateTime BETWEEN :previousFrom AND :to
            """)
    TicketsSoldProjection countTicketsSoldBetween(@Param("statuses") Set<ShowtimeStatus> statuses,
                                                  @Param("previousFrom") Instant previousFrom,
                                                  @Param("from") Instant from,
                                                  @Param("to") Instant to);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.statistics.StartDateTimeRevenueProjection(
                s.startDateTime,
                COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.totalAmount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN b.status = 'REFUNDED' THEN b.totalAmount ELSE 0 END), 0))
            FROM Booking b
            JOIN b.showtime s
            WHERE s.status IN :statuses
            AND s.startDateTime BETWEEN :from AND :to
            GROUP BY s.startDateTime
            """)
    List<StartDateTimeRevenueProjection> sumRevenuePerStartDateTimeBetween(@Param("statuses") Set<ShowtimeStatus> statuses,
                                                                           @Param("from") Instant from,
                                                                           @Param("to") Instant to);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.statistics.StartDateTimeTicketsSoldProjection(
                s.startDateTime,
                COUNT(bs.id))
            FROM BookingSeat bs
            JOIN bs.booking b
            JOIN bs.showtime s
            WHERE b.status = 'CONFIRMED'
            AND s.status IN :statuses
            AND s.startDateTime BETWEEN :from AND :to
            GROUP BY s.startDateTime
            """)
    List<StartDateTimeTicketsSoldProjection> countTicketsSoldPerStartDateTimeBetween(@Param("statuses") Set<ShowtimeStatus> statuses,
                                                                                     @Param("from") Instant from,
                                                                                     @Param("to") Instant to);

    @Query("""
            SELECT new com.mdevs.cinefy.projection.statistics.MovieTicketsSoldProjection(
                s.tmdbMovie.id,
                COUNT(bs.id))
            FROM BookingSeat bs
            JOIN bs.booking b
            JOIN bs.showtime s
            WHERE b.status = 'CONFIRMED'
            AND s.status IN :statuses
            AND s.tmdbMovie.id IN :movieIds
            AND s.startDateTime BETWEEN :from AND :to
            GROUP BY s.tmdbMovie.id
            """)
    List<MovieTicketsSoldProjection> countMovieTicketsSoldBetween(@Param("statuses") Set<ShowtimeStatus> statuses,
                                                                  @Param("movieIds") List<Long> movieIds,
                                                                  @Param("from") Instant from,
                                                                  @Param("to") Instant to);

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
