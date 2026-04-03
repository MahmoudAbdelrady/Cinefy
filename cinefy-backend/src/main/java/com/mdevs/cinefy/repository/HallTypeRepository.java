package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.HallType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HallTypeRepository extends JpaRepository<HallType, Long> {
    Optional<HallType> findByCode(String code);
}
