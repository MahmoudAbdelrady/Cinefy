package com.mdevs.cinefy.dto.movie;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieDetailDTO extends MovieBaseDTO {

    private String synopsis;

    private String contentRating;

    private Integer duration;

    private MovieCredits credits;

    private String trailerUrl;
}
