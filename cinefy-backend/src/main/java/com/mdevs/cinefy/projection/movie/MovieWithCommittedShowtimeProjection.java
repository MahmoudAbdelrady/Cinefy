package com.mdevs.cinefy.projection.movie;

import com.mdevs.cinefy.entity.TmdbMovie;

public interface MovieWithCommittedShowtimeProjection {

    TmdbMovie getMovie();

    Boolean getHasCommittedShowtime();
}
