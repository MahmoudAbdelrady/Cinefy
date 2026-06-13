package com.mdevs.cinefy.dto.movie;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieSummaryDTO extends MovieBaseDTO {

    private String contentRating;

    private Integer duration;

    private boolean isHighlighted;
}
