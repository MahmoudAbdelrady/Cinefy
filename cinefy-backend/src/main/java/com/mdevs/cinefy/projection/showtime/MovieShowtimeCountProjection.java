package com.mdevs.cinefy.projection.showtime;

public interface MovieShowtimeCountProjection {

    Long getMovieId();

    long getTotalShowtimes();

    long getTotalDraftShowtimes();
}
