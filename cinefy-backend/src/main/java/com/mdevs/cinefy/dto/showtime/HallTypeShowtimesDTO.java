package com.mdevs.cinefy.dto.showtime;

import java.util.List;

public record HallTypeShowtimesDTO(

        String hallType,

        List<BookingShowtimeDTO> showtimes
) {
}
