package com.mdevs.cinefy.dto;

public interface MovieShowtimeCountProjection {

    Long getMovieId();

    long getTotalShowtimes();

    long getTotalDraftShowtimes();
}
