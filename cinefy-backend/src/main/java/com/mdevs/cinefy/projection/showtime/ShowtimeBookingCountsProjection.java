package com.mdevs.cinefy.projection.showtime;

public interface ShowtimeBookingCountsProjection {

    Long getShowtimeId();

    int getBookedSeats();

    int getMyOnHoldSeats();
}
