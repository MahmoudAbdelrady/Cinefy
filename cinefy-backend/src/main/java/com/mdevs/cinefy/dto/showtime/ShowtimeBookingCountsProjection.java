package com.mdevs.cinefy.dto.showtime;

public interface ShowtimeBookingCountsProjection {

    Long getShowtimeId();

    int getBookedSeats();

    int getMyOnHoldSeats();
}
