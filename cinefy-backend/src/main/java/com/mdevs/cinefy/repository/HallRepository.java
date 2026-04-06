package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.HallType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;

public interface HallRepository extends BaseRepository<Hall> {

    @EntityGraph(attributePaths = {"type", "categoryPrices", "seats"})
    Optional<Hall> findByUuid(String uuid);

    @EntityGraph(attributePaths = "type")
    Page<Hall> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "type")
    Page<Hall> findByCodeContaining(String code, Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndUuidNot(String code, String uuid);

    boolean existsByType(HallType hallType);
}
