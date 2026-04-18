package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ShowtimeRepository extends BaseRepository<Showtime> {

    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
            FROM Showtime s
            WHERE s.hall = :hall
            AND s.status != 'CANCELLED'
            AND s.startDateTime < :end
            AND s.endDateTime > :start
            """)
    boolean existsOverlapping(@Param("hall") Hall hall, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
