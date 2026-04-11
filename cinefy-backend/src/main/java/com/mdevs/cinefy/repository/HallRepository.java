package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.HallType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface HallRepository extends BaseRepository<Hall> {

    @EntityGraph(attributePaths = {"type", "categoryPrices", "seats"})
    Optional<Hall> findByUuid(String uuid);

    @EntityGraph(attributePaths = "type")
    @Query("SELECT h FROM Hall h " +
            "WHERE (:search IS NULL OR h.code LIKE CONCAT('%', CAST(:search AS string), '%')) " +
            "AND (:excludeHallId IS NULL OR h.uuid != :excludeHallId)")
    Page<Hall> findAllFiltered(@Param("search") String search, @Param("excludeHallId") String excludeHallId, Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndUuidNot(String code, String uuid);

    boolean existsByType(HallType hallType);
}
