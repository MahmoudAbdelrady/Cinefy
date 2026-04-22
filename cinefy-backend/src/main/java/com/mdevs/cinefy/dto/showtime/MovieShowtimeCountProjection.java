package com.mdevs.cinefy.dto.showtime;

public interface MovieShowtimeCountProjection {

    Long getMovieId();

    long getTotalShowtimes();

    long getTotalDraftShowtimes();
}
