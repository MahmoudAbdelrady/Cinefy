package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.ShowtimeStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

public interface ShowtimeRepository extends BaseRepository<Showtime> {

    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
            FROM Showtime s
            WHERE s.hall = :hall
            AND s.status != 'CANCELLED'
            AND s.startDateTime < :end
            AND s.endDateTime > :start
            AND (:excludeUuid IS NULL OR s.uuid != :excludeUuid)
            """)
    boolean existsOverlapping(@Param("hall") Hall hall, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("excludeUuid") String excludeUuid);

    boolean existsByHallAndStatusIn(Hall hall, Collection<ShowtimeStatus> statuses);

    boolean existsByHallAndStatusInAndUuidNot(Hall hall, Collection<ShowtimeStatus> statuses, String uuid);

    Optional<Showtime> findByUuid(String uuid);
}
