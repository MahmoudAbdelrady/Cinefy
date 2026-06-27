package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.enums.HallStatus;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.entity.HallType;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface HallRepository extends BaseRepository<Hall> {

    Optional<Hall> findByUuid(String uuid);

    // NOTE: Suffers from two-collection fetch (categoryPrices x seats).
    @Query("""
            SELECT h FROM Hall h
            JOIN FETCH h.type
            JOIN FETCH h.categoryPrices
            JOIN FETCH h.seats
            WHERE h.uuid = :uuid
            """)
    Optional<Hall> findByUuidWithLayout(@Param("uuid") String uuid);

    @Query("SELECT h FROM Hall h JOIN FETCH h.type " +
            "WHERE (:excludeHallId IS NULL OR h.uuid != :excludeHallId) " +
            "AND (:statuses IS NULL OR h.status IN :statuses) ORDER BY h.createdAt")
    List<Hall> findAllFiltered(@Param("excludeHallId") String excludeHallId, @Param("statuses") List<HallStatus> statuses);

    @Modifying
    @Query("""
            UPDATE Hall h SET h.status = 'ACTIVE'
            WHERE h.status = 'SCHEDULED'
            AND NOT EXISTS (
                SELECT 1 FROM Showtime s
                WHERE s.hall = h
                AND s.status IN :showtimeStatuses
            )
            """)
    int flipIdleScheduledHallsToActive(@Param("showtimeStatuses") Set<ShowtimeStatus> showtimeStatuses);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByType(HallType hallType);
}
