package com.mdevs.cinefy.dto.hall;

import com.mdevs.cinefy.entity.enums.HallStatus;

public record HallStatusCountProjection(HallStatus status, Long total) {
}
