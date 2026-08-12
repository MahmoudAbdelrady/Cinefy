package com.mdevs.cinefy.dto.booking;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PastBookingDTO(

        String id,

        MovieSearchResultDTO movie,

        LocalDateTime startDateTime,

        String hallType,

        @JsonProperty("is3D")
        boolean is3D,

        boolean refunded,

        BigDecimal totalPrice
) {
}
