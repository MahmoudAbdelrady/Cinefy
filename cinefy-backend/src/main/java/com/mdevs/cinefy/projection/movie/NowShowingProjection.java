package com.mdevs.cinefy.projection.movie;

import com.mdevs.cinefy.entity.TmdbMovie;

public interface NowShowingProjection {

    TmdbMovie getMovie();

    Boolean getIs3D();

    String getHallTypes();
}
