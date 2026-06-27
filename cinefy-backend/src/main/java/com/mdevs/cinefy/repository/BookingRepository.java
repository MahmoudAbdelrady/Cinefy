package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Booking;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface BookingRepository extends BaseRepository<Booking> {

    @Modifying
    @Query("""
            DELETE FROM Booking b
            WHERE b.status = 'PENDING'
            AND b.expiresAt < :cutOffDate
            """)
    int deleteExpiredPending(@Param("cutOffDate") LocalDateTime cutOffDate);
}
