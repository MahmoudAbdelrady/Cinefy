package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Hall;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface HallRepository extends BaseRepository<Hall> {

    Optional<Hall> findByUuid(String uuid);

    Page<Hall> findByCodeContaining(String code, Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndUuidNot(String code, String uuid);

    boolean existsByTypeUuid(String typeUuid);
}
