package com.mdevs.cinefy.dto.movie;

import com.mdevs.cinefy.entity.TmdbMovie;

public interface NowShowingProjection {

    TmdbMovie getMovie();

    Boolean getIs3D();
}
