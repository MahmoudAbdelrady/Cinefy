package com.mdevs.cinefy.dto.booking;

import com.mdevs.cinefy.entity.enums.SeatCategory;

import java.math.BigDecimal;

public record BookedSeatDTO(String position, SeatCategory category, BigDecimal price) {
}
