package com.mdevs.cinefy.dto.showtime;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BookingShowtimeDTO(

        String id,

        String time,

        @JsonProperty("is3D")
        boolean is3D,

        boolean fullyBooked
) {
}
