package com.mdevs.cinefy.dto.statistics;

import com.mdevs.cinefy.entity.Hall;

public record MovieHallProjection(Long movieId, Hall hall) {
}
