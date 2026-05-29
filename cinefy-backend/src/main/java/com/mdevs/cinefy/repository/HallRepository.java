package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.dto.hall.HallStatisticsDTO;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.enums.HallStatus;
import com.mdevs.cinefy.entity.HallType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HallRepository extends BaseRepository<Hall> {

    @EntityGraph(attributePaths = {"type", "categoryPrices", "seats"})
    Optional<Hall> findByUuid(String uuid);

    @Query("SELECT h FROM Hall h JOIN FETCH h.type " +
            "WHERE (:excludeHallId IS NULL OR h.uuid != :excludeHallId) " +
            "AND (:statuses IS NULL OR h.status IN :statuses) ORDER BY h.createdAt")
    List<Hall> findAllFiltered(@Param("excludeHallId") String excludeHallId, @Param("statuses") List<HallStatus> statuses);

    @Query("SELECT new com.mdevs.cinefy.dto.hall.HallStatisticsDTO(" +
            "COUNT(h), " +
            "SUM(CASE WHEN h.status = 'ACTIVE' THEN 1 ELSE 0 END), " +
            "COALESCE(SUM(h.totalRows * h.totalColumns), 0)) " +
            "FROM Hall h")
    HallStatisticsDTO getStatistics();

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByType(HallType hallType);
}
