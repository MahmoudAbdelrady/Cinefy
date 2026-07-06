package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.dto.showtime.ShowtimeReservedSeatsProjection;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.BookingSeat;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    List<String> findReservedPositions(@Param("showtimeId") Long showtimeId,
                                       @Param("now") LocalDateTime now);

    @Query("""
            SELECT bs.showtime.id AS showtimeId, COUNT(bs.id) AS reservedSeats
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
    List<ShowtimeReservedSeatsProjection> countReservedSeatsByShowtime(@Param("showtimeIds") List<Long> showtimeIds,
                                                                       @Param("now") LocalDateTime now,
                                                                       @Param("clientId") Long clientId,
                                                                       @Param("staffId") Long staffId);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            WHERE b.showtime.id = :showtimeId
            AND b.onHold = true
            AND b.expiresAt > :now
            AND (b.client.id = :userId OR b.bookedBy.id = :userId)
            """)
    Optional<Booking> findMyActiveBooking(@Param("showtimeId") Long showtimeId,
                                          @Param("userId") Long userId,
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
            WHERE b.onHold = true
            AND b.client.id = :clientId
            AND b.showtime.id = :showtimeId
            """)
    Optional<Booking> findOnHoldByClientAndShowtime(@Param("clientId") Long clientId,
                                                    @Param("showtimeId") Long showtimeId);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.seats
            JOIN FETCH b.showtime s
            JOIN FETCH s.tmdbMovie
            WHERE b.onHold = true
            AND b.expiresAt > :now
            AND b.client.id = :clientId
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

    @Modifying
    @Query("DELETE FROM BookingSeat bs WHERE bs.booking.id IN :bookingIds")
    void deleteSeatsByBookingIds(@Param("bookingIds") List<Long> bookingIds);

    @Modifying
    @Query("DELETE FROM Booking b WHERE b.id IN :bookingIds")
    int deleteBookingsByIds(@Param("bookingIds") List<Long> bookingIds);
}
