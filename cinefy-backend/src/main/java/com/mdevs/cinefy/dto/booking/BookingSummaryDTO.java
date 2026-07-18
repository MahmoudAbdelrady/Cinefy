package com.mdevs.cinefy.dto.booking;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingSummaryDTO(
        String id,

        String showtimeId,

        LocalDateTime expiresAt,

        MovieSearchResultDTO movie,

        LocalDateTime startDateTime,

        String hallName,

        String hallType,

        @JsonProperty("is3D")
        boolean is3D,

        int totalTickets,

        BigDecimal totalPrice
) {
}
