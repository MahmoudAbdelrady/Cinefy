package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatRepository extends JpaRepository<Seat, Long> {
}
