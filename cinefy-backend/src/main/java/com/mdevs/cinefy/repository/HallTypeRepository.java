package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.HallType;

import java.util.Optional;

public interface HallTypeRepository extends BaseRepository<HallType> {

    Optional<HallType> findByUuid(String uuid);

    Optional<HallType> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndUuidNot(String code, String uuid);
}
