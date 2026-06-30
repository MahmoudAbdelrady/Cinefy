package com.mdevs.cinefy.repository;

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
            SELECT b.id FROM Booking b
            WHERE b.status = 'PENDING'
            AND b.expiresAt < :cutOffDate
            ORDER BY b.expiresAt
            """)
    List<Long> findExpiredPendingIds(@Param("cutOffDate") LocalDateTime cutOffDate, Pageable pageable);

    @Modifying
    @Query("DELETE FROM BookingSeat bs WHERE bs.booking.id IN :bookingIds")
    void deleteSeatsByBookingIds(@Param("bookingIds") List<Long> bookingIds);

    @Modifying
    @Query("DELETE FROM Booking b WHERE b.id IN :bookingIds")
    int deleteBookingsByIds(@Param("bookingIds") List<Long> bookingIds);
}
