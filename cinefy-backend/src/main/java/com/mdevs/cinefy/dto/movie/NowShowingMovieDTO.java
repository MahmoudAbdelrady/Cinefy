package com.mdevs.cinefy.dto.movie;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class NowShowingMovieDTO extends MovieBaseDTO {

    @JsonProperty("is3D")
    private boolean is3D;

    private List<String> experiences;

    private String contentRating;
}
