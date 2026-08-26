package com.mdevs.cinefy.dto.staff;

import com.mdevs.cinefy.entity.enums.StaffPosition;

import java.util.Map;

public record OnShiftSummaryDTO(long total, Map<StaffPosition, Long> details) {
}
