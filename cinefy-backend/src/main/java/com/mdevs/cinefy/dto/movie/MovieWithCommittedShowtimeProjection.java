package com.mdevs.cinefy.dto.movie;

import com.mdevs.cinefy.entity.TmdbMovie;

public interface MovieWithCommittedShowtimeProjection {

    TmdbMovie getMovie();

    Boolean getHasCommittedShowtime();
}
