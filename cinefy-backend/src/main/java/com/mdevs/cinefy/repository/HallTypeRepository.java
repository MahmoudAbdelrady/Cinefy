package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.HallType;

import java.util.List;
import java.util.Optional;

public interface HallTypeRepository extends BaseRepository<HallType> {

    List<HallType> findAllByOrderByCreatedAtAsc();

    Optional<HallType> findByUuid(String uuid);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
